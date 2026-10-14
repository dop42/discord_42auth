import type { Messages } from './types';

export const es: Messages = {
	'cmd.config': 'Mostrar la configuración de la autenticación 42 de este servidor',
	'cmd.panel': 'Publicar el panel de verificación en este canal',
	'cmd.forget': 'Borrar tu vínculo 42 en este servidor y devolver el rol verificado',

	'error.notInGuild': 'Este comando solo funciona dentro de un servidor.',
	'error.unknown': 'Algo salió mal. Inténtalo de nuevo en un momento.',

	'auth.notConfigured': 'Este servidor aún no está configurado — un admin debe elegir un rol en el panel web.',
	'auth.notice': 'Inicia sesión con el botón de abajo. Este enlace es personal y caduca en 5 minutos — no lo compartas nunca.',
	'auth.privacy': 'La verificación vincula tu cuenta de Discord a tu id y login de 42 mientras sigas en este servidor. `/forget` lo borra. [Privacidad]({privacy})',
	'auth.button': 'Iniciar sesión en la intra 42',

	'panel.title': 'Verificación 42',
	'panel.body': 'Vincula tu cuenta 42 para acceder a este servidor.',
	'panel.button': 'Verificarme',

	'config.noPermission': 'Necesitas el permiso **Gestionar servidor** para ver la configuración.',
	'forget.done': 'Tu vínculo 42 en este servidor está borrado y el rol verificado retirado.',
	'forget.none': 'No hay ninguna cuenta 42 vinculada a ti en este servidor.',
	'forget.roleKept': 'Tu vínculo 42 está borrado, pero no se pudo retirar el rol verificado — pide ayuda a un admin.',

	'show.role': 'Rol',
	'show.role.unset': '_sin definir, la verificación está desactivada_',
	'show.campus': 'Campus',
	'show.campus.any': '_cualquiera_',
	'show.students': 'Solo estudiantes activos',
	'show.nickname': 'Apodo',
	'show.nickname.off': 'sin cambios',
	'show.nickname.login': 'login de intra (`jdoe`)',
	'show.nickname.full': 'nombre completo + login (`John Doe (jdoe)`)',
	'show.logs': 'Canal de registro',
	'show.logs.none': '_ninguno_',
	'show.yes': 'sí',
	'show.no': 'no',
	'show.hint': 'Cambia estos ajustes en el panel web: {url}',

	'rule.inactive': 'Esta cuenta 42 no está activa (alumni o cuenta cerrada).',
	'rule.wrongCampus': 'Este servidor está restringido al campus {campus}, el tuyo es {userCampus}.',
	'rule.alreadyLinked': 'Esta cuenta 42 ya está vinculada a otro miembro de este servidor.',

	'page.cancelled.title': 'Autenticación cancelada',
	'page.cancelled.body': 'Has denegado el acceso a tu cuenta 42.',
	'page.invalid.title': 'Enlace inválido',
	'page.invalid.body': 'Este enlace ha caducado o está malformado. Vuelve a pulsar el botón de verificación.',
	'page.refused.title': 'Acceso denegado',
	'page.notConfigured.title': 'Servidor sin configurar',
	'page.notConfigured.body': 'No hay ningún rol configurado. Pide a un admin que elija uno en el panel web.',
	'page.failed.title': 'Fallo en la autenticación',
	'page.failed.body': 'Algo salió mal por nuestra parte. Inténtalo de nuevo en un momento.',

	'log.ok': 'Autenticación correcta',
	'log.refused': 'Autenticación denegada',
	'log.discord': 'Discord',
	'log.account': 'Cuenta 42',
	'log.campus': 'Campus',
	'log.reason': 'Motivo',
	'log.unknown': 'desconocido',
};
