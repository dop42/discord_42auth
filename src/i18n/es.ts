import type { Messages } from './types';

export const es: Messages = {
	'cmd.auth': 'Verifica tu cuenta 42 para acceder a este servidor',
	'cmd.config': 'Mostrar la configuración de la autenticación 42 de este servidor',
	'cmd.panel': 'Publicar el panel de verificación en este canal',

	'error.notInGuild': 'Este comando solo funciona dentro de un servidor.',
	'error.wrongGuild': 'Este bot está configurado para otro servidor.',
	'error.unknown': 'Algo salió mal. Pide a un admin que revise los logs del despliegue.',

	'auth.notConfigured': 'Este servidor aún no está configurado — un admin debe definir `ROLE_ID` en el despliegue.',
	'auth.notice': 'Inicia sesión con el botón de abajo. Este enlace es personal y caduca en 5 minutos — no lo compartas nunca.',
	'auth.button': 'Iniciar sesión en la intra 42',

	'panel.title': 'Verificación 42',
	'panel.body': 'Vincula tu cuenta 42 para acceder a este servidor.',
	'panel.button': 'Verificarme',

	'config.noPermission': 'Necesitas el permiso **Gestionar servidor** para ver la configuración.',

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
	'show.hint': 'Estos ajustes vienen de variables de entorno — cámbialos en Vercel y vuelve a desplegar.',

	'rule.inactive': 'Esta cuenta 42 no está activa (alumni o cuenta cerrada).',
	'rule.wrongCampus': 'Este servidor está restringido al campus {campus}, el tuyo es {userCampus}.',

	'page.cancelled.title': 'Autenticación cancelada',
	'page.cancelled.body': 'Has denegado el acceso a tu cuenta 42.',
	'page.invalid.title': 'Enlace inválido',
	'page.invalid.body': 'Este enlace ha caducado o está malformado. Consigue otro en el panel de verificación, o ejecuta /auth.',
	'page.refused.title': 'Acceso denegado',
	'page.notConfigured.title': 'Servidor sin configurar',
	'page.notConfigured.body': 'No hay ningún rol configurado. Pide a un admin que defina ROLE_ID en el despliegue.',
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
