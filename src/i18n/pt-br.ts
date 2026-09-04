import type { Messages } from './types';

export const ptBR: Messages = {
	'cmd.config': 'Mostrar as configurações de autenticação 42 deste servidor',
	'cmd.panel': 'Publicar o painel de verificação neste canal',

	'error.notInGuild': 'Este comando só funciona dentro de um servidor.',
	'error.wrongGuild': 'Este bot está configurado para outro servidor.',
	'error.unknown': 'Algo deu errado. Peça a um admin para verificar os logs do deploy.',

	'auth.notConfigured': 'Este servidor ainda não está configurado — um admin precisa definir `ROLE_ID` no deploy.',
	'auth.notice': 'Entre com o botão abaixo. Este link é pessoal e expira em 5 minutos — nunca o compartilhe.',
	'auth.button': 'Entrar na intra 42',

	'panel.title': 'Verificação 42',
	'panel.body': 'Vincule sua conta 42 para ter acesso a este servidor.',
	'panel.button': 'Verificar',

	'config.noPermission': 'Você precisa da permissão **Gerenciar servidor** para ver as configurações.',

	'show.role': 'Cargo',
	'show.role.unset': '_não definido, a verificação está desativada_',
	'show.campus': 'Campus',
	'show.campus.any': '_todos_',
	'show.students': 'Somente estudantes ativos',
	'show.nickname': 'Apelido',
	'show.nickname.off': 'inalterado',
	'show.nickname.login': 'login da intra (`jdoe`)',
	'show.nickname.full': 'nome completo + login (`John Doe (jdoe)`)',
	'show.logs': 'Canal de registro',
	'show.logs.none': '_nenhum_',
	'show.yes': 'sim',
	'show.no': 'não',
	'show.hint': 'Estas configurações vêm de variáveis de ambiente — altere-as na Vercel e faça o deploy de novo.',

	'rule.inactive': 'Esta conta 42 não está ativa (alumni ou conta encerrada).',
	'rule.wrongCampus': 'Este servidor é restrito ao campus {campus}, o seu é {userCampus}.',

	'page.cancelled.title': 'Autenticação cancelada',
	'page.cancelled.body': 'Você negou o acesso à sua conta 42.',
	'page.invalid.title': 'Link inválido',
	'page.invalid.body': 'Este link expirou ou está malformado. Aperte o botão de verificação de novo.',
	'page.refused.title': 'Acesso negado',
	'page.notConfigured.title': 'Servidor não configurado',
	'page.notConfigured.body': 'Nenhum cargo foi configurado. Peça a um admin para definir ROLE_ID no deploy.',
	'page.failed.title': 'Falha na autenticação',
	'page.failed.body': 'Algo deu errado do nosso lado. Tente novamente em instantes.',

	'log.ok': 'Autenticação bem-sucedida',
	'log.refused': 'Autenticação recusada',
	'log.discord': 'Discord',
	'log.account': 'Conta 42',
	'log.campus': 'Campus',
	'log.reason': 'Motivo',
	'log.unknown': 'desconhecido',
};
