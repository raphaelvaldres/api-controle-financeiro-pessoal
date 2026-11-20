import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import request from 'supertest';
import { AppController } from '../src/app.controller';
import { TransacoesController } from '../src/transacoes/transacoes.controller';
import { TransacoesService } from '../src/transacoes/transacoes.service';

describe('Front-end e API (e2e sem banco real)', () => {
  let app: NestExpressApplication;

  const service = {
    listar: jest.fn(),
    criar: jest.fn(),
  };

  beforeAll(async () => {
    service.listar.mockResolvedValue({
      metricas: {
        saldoTotal: 1200,
        totalDespesas: 300,
        totalGastoImpulso: 50,
      },
      historico: [],
    });
    service.criar.mockImplementation(async (dto: object) => ({
      id: 'id-teste',
      ...dto,
    }));

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController, TransacoesController],
      providers: [{ provide: TransacoesService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.useStaticAssets(join(__dirname, '..', 'src', 'public'));
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('abre a interface na rota inicial', async () => {
    const resposta = await request(app.getHttpServer()).get('/').expect(200);
    expect(resposta.text).toContain('id="view-dashboard"');
    expect(resposta.text).toContain('id="transaction-form"');
  });

  it('disponibiliza os arquivos CSS e JavaScript', async () => {
    const css = await request(app.getHttpServer()).get('/css/style.css').expect(200);
    expect(css.text).toContain('.metrics-grid');

    const js = await request(app.getHttpServer()).get('/js/main.js').expect(200);
    expect(js.text).toContain('/transacoes');
  });

  it('retorna as métricas e o histórico pela API', async () => {
    const resposta = await request(app.getHttpServer()).get('/transacoes').expect(200);
    expect(resposta.body.metricas).toEqual({
      saldoTotal: 1200,
      totalDespesas: 300,
      totalGastoImpulso: 50,
    });
    expect(resposta.body.historico).toEqual([]);
  });

  it('recebe o cadastro de uma transação pelo POST', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/transacoes')
      .send({
        descricao: 'Compra de supermercado',
        valor: 150,
        tipo: 'despesa',
        categoria: 'Alimentação',
        consumoConsciente: true,
      })
      .expect(201);

    expect(resposta.body.id).toBe('id-teste');
    expect(resposta.body.descricao).toBe('Compra de supermercado');
    expect(resposta.body.consumoConsciente).toBe(true);
  });
});
