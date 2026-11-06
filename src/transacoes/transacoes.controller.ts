import { Body, Controller, Get, Post } from '@nestjs/common';
import { CriarTransacaoDto } from './dto/criar-transacao.dto';
import { ListagemTransacoes, TransacaoResposta, TransacoesService } from './transacoes.service';

@Controller('transacoes')
export class TransacoesController {
  constructor(private readonly transacoesService: TransacoesService) {}

  @Post()
  cadastrar(@Body() dto: CriarTransacaoDto): Promise<TransacaoResposta> {
    return this.transacoesService.criar(dto);
  }

  @Get()
  consultar(): Promise<ListagemTransacoes> {
    return this.transacoesService.listar();
  }
}
