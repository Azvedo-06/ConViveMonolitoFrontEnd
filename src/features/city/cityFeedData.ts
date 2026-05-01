import type { CityTheme } from '../../theme/cityTheme';

export type FeedCategory = 'eventos' | 'cursos' | 'atividades' | 'informativos';

export type CityFeedItem = {
  id: string;
  city: CityTheme;
  category: FeedCategory;
  title: string;
  summary: string;
  details: string;
  date: string;
  location: string;
  organizer: string;
  contact: string;
  tags: string[];
};

export const cityFeedData: CityFeedItem[] = [
  {
    id: 'cm-evento-1',
    city: 'campo-mourao',
    category: 'eventos',
    title: 'Feira Comunitaria da Praca Central',
    summary: 'Empreendedores locais, musica ao vivo e espaco kids durante toda a manha.',
    details:
      'Evento aberto para toda a cidade com feira de produtos locais, apresentacoes culturais e espaco infantil. Leve sua cadeira, garrafa de agua e participe das atividades da comunidade.',
    date: 'Sabado, 09:00',
    location: 'Praca Sao Jose',
    organizer: 'Associacao de Moradores Centro',
    contact: '(44) 99911-2200',
    tags: ['familia', 'empreendedorismo', 'cultura'],
  },
  {
    id: 'cm-evento-2',
    city: 'campo-mourao',
    category: 'eventos',
    title: 'Cinema ao Ar Livre no Parque do Lago',
    summary: 'Sessao gratuita com cadeiras na grama e pipoca para a comunidade.',
    details:
      'A programacao traz um filme familiar exibido ao ar livre, com apoio de voluntarios e estrutura simples para receber moradores de varios bairros.',
    date: 'Domingo, 19:00',
    location: 'Parque do Lago',
    organizer: 'ConVive Cultural',
    contact: '(44) 99911-2210',
    tags: ['cultura', 'familia', 'gratis'],
  },
  {
    id: 'cm-curso-1',
    city: 'campo-mourao',
    category: 'cursos',
    title: 'Curso Basico de Informatica para Adultos',
    summary: 'Aulas praticas com foco em celular, e-mail, documentos e seguranca digital.',
    details:
      'Turma com duracao de 6 semanas, aulas presenciais e material de apoio. Ideal para quem quer aprender a usar melhor o celular e o computador no dia a dia.',
    date: 'Segunda, 19:00',
    location: 'CRAS Lar Parana',
    organizer: 'Secretaria de Assistencia Social',
    contact: '(44) 3518-4400',
    tags: ['tecnologia', 'iniciacao', 'gratuito'],
  },
  {
    id: 'cm-curso-2',
    city: 'campo-mourao',
    category: 'cursos',
    title: 'Oficina de Curriculo e Entrevista',
    summary: 'Atividade rapida para quem quer se preparar melhor para vagas de trabalho.',
    details:
      'A oficina ensina como montar um curriculo simples, organizar experiencias e treinar respostas para entrevistas com recrutadores locais.',
    date: 'Terca, 18:30',
    location: 'UTFPR Campus Campo Mourao',
    organizer: 'SINE Campo Mourao',
    contact: '(44) 3525-3300',
    tags: ['emprego', 'carreira', 'oficina'],
  },
  {
    id: 'cm-atividade-1',
    city: 'campo-mourao',
    category: 'atividades',
    title: 'Aula Aberta de Alongamento e Bem-Estar',
    summary: 'Encontro gratuito para todas as idades com equipe de educacao fisica.',
    details:
      'Atividade coletiva com foco em mobilidade, respiracao e postura. Nao e necessario inscricao previa, apenas chegue com roupa confortavel.',
    date: 'Terca, 07:00',
    location: 'Parque Municipal',
    organizer: 'ConVive + Parceiros da Saude',
    contact: '(44) 99821-8701',
    tags: ['saude', 'ar-livre', 'bem-estar'],
  },
  {
    id: 'cm-atividade-2',
    city: 'campo-mourao',
    category: 'atividades',
    title: 'Brincar na Praca - Tarde com as Criancas',
    summary: 'Atividades ludicas, pintura facial e movimento para a familia toda.',
    details:
      'A acao ocupa um fim de tarde na praça com brinquedos, jogos cooperativos e monitoria voluntaria, ideal para pais e filhos.',
    date: 'Sabado, 15:00',
    location: 'Praca Sao Jose',
    organizer: 'Projeto Brincar e Crescer',
    contact: '(44) 99821-8702',
    tags: ['infantil', 'familia', 'comunidade'],
  },
  {
    id: 'cm-info-1',
    city: 'campo-mourao',
    category: 'informativos',
    title: 'Mutirao de Documentacao Social',
    summary: 'Atendimento para segunda via de certidoes e orientacao de beneficios.',
    details:
      'Plantao especial com orientacao para CadUnico, beneficios sociais e regularizacao de documentos. Atendimento por ordem de chegada.',
    date: 'Quinta, 14:00',
    location: 'Centro de Integracao Comunitaria',
    organizer: 'Prefeitura de Campo Mourao',
    contact: '(44) 3523-1188',
    tags: ['servicos-publicos', 'documentacao', 'assistencia'],
  },
  {
    id: 'cm-info-2',
    city: 'campo-mourao',
    category: 'informativos',
    title: 'Atualizacao do Atendimento no Paço Municipal',
    summary: 'Confira o horario especial de atendimento ao publico nesta semana.',
    details:
      'Informativo para orientar a populacao sobre horarios especiais, canais de contato e servicos que podem ser resolvidos presencialmente ou por telefone.',
    date: 'Atualizado ontem',
    location: 'Paço Municipal 10 de Outubro',
    organizer: 'Prefeitura de Campo Mourao',
    contact: '(44) 3518-1144',
    tags: ['prefeitura', 'atendimento', 'servicos'],
  },
  {
    id: 'mb-evento-1',
    city: 'mambore',
    category: 'eventos',
    title: 'Encontro Cultural da Juventude',
    summary: 'Apresentacoes artisticas, oficina de graffiti e batalha de rima local.',
    details:
      'Programacao voltada para juventude com espacos de expressao artistica, palco aberto e oficinas criativas conduzidas por coletivos locais.',
    date: 'Sabado, 16:00',
    location: 'Ginasio Municipal',
    organizer: 'Coletivo Jovem Mambore',
    contact: '(44) 99973-1104',
    tags: ['juventude', 'cultura', 'arte-urbana'],
  },
  {
    id: 'mb-evento-2',
    city: 'mambore',
    category: 'eventos',
    title: 'Festa de Integração no Centro da Cidade',
    summary: 'Apresentacoes locais, barracas da comunidade e encontro entre bairros.',
    details:
      'Evento pensado para valorizar os grupos da cidade, com barracas de alimentos, palco comunitario e espaco de convivio para familias.',
    date: 'Domingo, 17:00',
    location: 'Praca Central de Mambore',
    organizer: 'Associacao Cultural de Mambore',
    contact: '(44) 3568-2240',
    tags: ['familia', 'convivio', 'cultura'],
  },
  {
    id: 'mb-curso-1',
    city: 'mambore',
    category: 'cursos',
    title: 'Oficina de Producao de Conteudo para Redes',
    summary: 'Como gravar, editar e publicar videos para divulgar projetos comunitarios.',
    details:
      'Oficina pratica para liderancas de projetos sociais aprenderem roteiro, gravacao com celular e edicao basica para Instagram e Reels.',
    date: 'Quarta, 19:30',
    location: 'Biblioteca Publica',
    organizer: 'Sala do Empreendedor',
    contact: '(44) 3568-1200',
    tags: ['comunicacao', 'midias-sociais', 'oficina'],
  },
  {
    id: 'mb-curso-2',
    city: 'mambore',
    category: 'cursos',
    title: 'Curso de Confeitaria Caseira',
    summary: 'Aprenda receitas simples para vender e gerar renda extra.',
    details:
      'Aulas com foco em producao domestica, precificacao basica e embalagem para pequenos empreendedores da cidade.',
    date: 'Quinta, 14:00',
    location: 'Sala do Empreendedor de Mambore',
    organizer: 'Sistema S + Prefeitura',
    contact: '(44) 3568-3355',
    tags: ['empreendedorismo', 'culinaria', 'renda'],
  },
  {
    id: 'mb-atividade-1',
    city: 'mambore',
    category: 'atividades',
    title: 'Roda de Conversa para Familias Atipicas',
    summary: 'Espaco de escuta e troca de experiencias com mediacao especializada.',
    details:
      'Encontro mensal com acolhimento e orientacoes praticas para familiares e cuidadores. Participacao aberta, com apoio de profissionais convidados.',
    date: 'Sexta, 18:30',
    location: 'Unidade Basica de Saude Centro',
    organizer: 'Rede de Apoio ConVive',
    contact: '(44) 99814-6060',
    tags: ['acolhimento', 'familias', 'saude-mental'],
  },
  {
    id: 'mb-atividade-2',
    city: 'mambore',
    category: 'atividades',
    title: 'Caminhada de Conscientização e Saude',
    summary: 'Percurso leve com orientacoes de saude e alongamento guiado.',
    details:
      'Atividade aberta que percorre trechos centrais da cidade com pontos de hidratacao e equipe de apoio para todas as idades.',
    date: 'Sabado, 08:00',
    location: 'Saida da Prefeitura Municipal de Mambore',
    organizer: 'Equipe de Saude Comunitaria',
    contact: '(44) 99814-6061',
    tags: ['saude', 'caminhada', 'bem-estar'],
  },
  {
    id: 'mb-info-1',
    city: 'mambore',
    category: 'informativos',
    title: 'Calendario de Vacinacao Atualizado',
    summary: 'Confira os dias e os bairros com atendimento estendido neste mes.',
    details:
      'Cronograma especial com horarios ampliados em unidades selecionadas. Consulte o bairro, documento necessario e faixa etaria de cada campanha.',
    date: 'Atualizado hoje',
    location: 'Todas as UBS',
    organizer: 'Secretaria Municipal de Saude',
    contact: '(44) 3568-9900',
    tags: ['saude', 'vacinacao', 'utilidade-publica'],
  },
  {
    id: 'mb-info-2',
    city: 'mambore',
    category: 'informativos',
    title: 'Nova Agenda do Transporte Escolar',
    summary: 'Horarios atualizados para bairros e zona rural.',
    details:
      'Informe para familias que utilizam transporte escolar com linhas, horarios e canais para solicitar ajuste ou tirar duvidas.',
    date: 'Atualizado hoje',
    location: 'Secretaria de Educacao de Mambore',
    organizer: 'Prefeitura de Mambore',
    contact: '(44) 3568-4422',
    tags: ['educacao', 'transporte', 'familia'],
  },
];