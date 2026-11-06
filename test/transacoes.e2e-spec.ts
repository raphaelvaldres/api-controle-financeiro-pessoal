import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TransacoesController } from '../src/transacoes/transacoes.controller';
import { TransacoesService } from '../src/transacoes/transacoes.service';

describe('TransacoesController (e2e sem banco real)', () => {
  let app: INestApplication;
  const service = {
    criar: jest.fn(),
    listar: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service.criar.mockImplementation(async (dto) => ({ id: 'id-teste', ...dto }));
    service.listar.mockResolvedValue({
      historico: [],
      metricas: { saldoTotal: 0, totalDespesas: 0, totalGastoImpulso: 0 },
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TransacoesController],
      providers: [{ provide: TransacoesService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, forbidNonWhitelisted: true, transform: true,
    }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /transacoes aceita transação válida', () => {
    return request(app.getHttpServer())
      .post('/transacoes')
      .send({
        descricao: 'Conta de luz', valor: 120.5,
        tipo: 'despesa', categoria: 'Moradia', consumoConsciente: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe('id-teste');
        expect(body.valor).toBe(120.5);
      });
  });

  it('POST /transacoes rejeita tipo inválido', () => {
    return request(app.getHttpServer())
      .post('/transacoes')
      .send({
        descricao: 'Gasto', valor: 50,
        tipo: 'outro', categoria: 'Lazer', consumoConsciente: false,
      })
      .expect(400);
  });

  it('GET /transacoes devolve histórico e métricas', () => {
    return request(app.getHttpServer())
      .get('/transacoes')
      .expect(200)
      .expect(({ body }) => {
        expect(body.historico).toEqual([]);
        expect(body.metricas).toEqual({
          saldoTotal: 0, totalDespesas: 0, totalGastoImpulso: 0,
        });
      });
  });
});
