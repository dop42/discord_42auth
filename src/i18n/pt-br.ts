import type { Messages } from './types';

export const ptBR: Messages = {
	'cmd.config': 'Mostrar as configurações de autenticação 42 deste servidor',
	'cmd.panel': 'Publicar o painel de verificação neste canal',
	'cmd.forget': 'Apagar seu vínculo 42 neste servidor e devolver o cargo verificado',

	'error.notInGuild': 'Este comando só funciona dentro de um servidor.',
	'error.unknown': 'Algo deu errado. Tente de novo em instantes.',

	'auth.notConfigured': 'Este servidor ainda não está configurado — um admin precisa escolher um cargo no painel web.',
	'auth.notice': 'Entre com o botão abaixo. Este link é pessoal e expira em 5 minutos — nunca o compartilhe.',
	'auth.privacy': 'A verificação vincula sua conta do Discord ao seu id e login 42 enquanto você estiver neste servidor. `/forget` apaga isso. [Privacidade]({privacy})',
	'auth.button': 'Entrar na intra 42',

	'panel.title': 'Verificação 42',
	'panel.body': 'Vincule sua conta 42 para ter acesso a este servidor.',
	'panel.button': 'Verificar',

	'config.noPermission': 'Você precisa da permissão **Gerenciar servidor** para ver as configurações.',
	'forget.done': 'Seu vínculo 42 neste servidor foi apagado e o cargo verificado removido.',
	'forget.none': 'Nenhuma conta 42 está vinculada a você neste servidor.',
	'forget.roleKept': 'Seu vínculo 42 foi apagado, mas o cargo não pôde ser removido — peça a um admin.',

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
	'show.hint': 'Altere estas configurações no painel web: {url}',

	'rule.inactive': 'Esta conta 42 não está ativa (alumni ou conta encerrada).',
	'rule.wrongCampus': 'Este servidor é restrito ao campus {campus}, o seu é {userCampus}.',
	'rule.alreadyLinked': 'Esta conta 42 já está vinculada a outro membro deste servidor.',

	'page.cancelled.title': 'Autenticação cancelada',
	'page.cancelled.body': 'Você negou o acesso à sua conta 42.',
	'page.invalid.title': 'Link inválido',
	'page.invalid.body': 'Este link expirou ou está malformado. Aperte o botão de verificação de novo.',
	'page.refused.title': 'Acesso negado',
	'page.notConfigured.title': 'Servidor não configurado',
	'page.notConfigured.body': 'Nenhum cargo foi configurado. Peça a um admin para escolher um no painel web.',
	'page.failed.title': 'Falha na autenticação',
	'page.failed.body': 'Algo deu errado do nosso lado. Tente novamente em instantes.',

	'log.ok': 'Autenticação bem-sucedida',
	'log.refused': 'Autenticação recusada',
	'log.revoked': 'Verificação revogada',
	'log.discord': 'Discord',
	'log.account': 'Conta 42',
	'log.campus': 'Campus',
	'log.reason': 'Motivo',
	'log.unknown': 'desconhecido',
};
