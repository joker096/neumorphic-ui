// @ts-ignore
const fs = require('fs');
const locales = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'];

// All login translations (EN is primary, others translated)
const translations = {
  en: {
    title: 'Login',
    subtitle: 'Sign in to your account',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    captcha: 'CAPTCHA',
    captchaPlaceholder: 'Enter the code shown',
    refreshCaptcha: 'Refresh',
    signIn: 'Sign In'
  },
  ru: {
    title: 'Вход',
    subtitle: 'Войдите в свой аккаунт',
    username: 'Имя пользователя',
    usernamePlaceholder: 'Введите имя пользователя',
    password: 'Пароль',
    passwordPlaceholder: 'Введите пароль',
    captcha: 'Капча',
    captchaPlaceholder: 'Введите код',
    refreshCaptcha: 'Обновить',
    signIn: 'Войти'
  },
  de: {
    title: 'Login',
    subtitle: 'Sign in to your account',
    username: 'Benutzername',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    captcha: 'CAPTCHA',
    captchaPlaceholder: 'Enter the code shown',
    refreshCaptcha: 'Refresh',
    signIn: 'Sign In'
  },
  es: {
    title: 'Iniciar sesi\x6f\x6eu',
    subtitle: 'Inicia sesi\x6f\x6eu en tu cuenta',
    username: 'Nombre de usuario',
    usernamePlaceholder: 'Ingresa tu nombre de usuario',
    password: 'Contrase\x6fu\x61',
    passwordPlaceholder: 'Ingresa tu contrase\x6fu\x61',
    captcha: 'CAPTCHA',
    captchaPlaceholder: 'Ingresa el c\xd3\xd3\x8dgo mostrado',
    refreshCaptcha: 'Actualizar',
    signIn: 'Iniciar sesi\x6f\x6eu'
  },
  fr: {
    title: 'Connexion',
    subtitle: 'Connectez-vous \x00\xa0\xe0 votre compte',
    username: 'Nom d\'utilisateur',
    usernamePlaceholder: 'Entrez votre nom d\'utilisateur',
    password: 'Mot de passe',
    passwordPlaceholder: 'Entrez votre mot de passe',
    captcha: 'CAPTCHA',
    captchaPlaceholder: 'Entrez le code affich\xe9',
    refreshCaptcha: 'Actualiser',
    signIn: 'Se connecter'
  },
  zh: {
    title: '\xd4\x9b\xd4\x9b\x9e\x9b\x81',
    subtitle: '\xd4\x9b\xd4\x9b\x9e\x9b\x81h\x00\x00\xaak\x00\x00\x8au',
    username: '\xd4\x9b\xd4\x9b\x9e\x9b\x81m\x00\x00\x89\xd4\x9b\xd4\x9b',
    usernamePlaceholder: '\xf5\xf5\xedr\xfbn \xf5nxin de d\xf0\x8aim\xf0\x9b',
    password: '\xc8m\x00\xe0',
    passwordPlaceholder: '\xf5\xf5\xedr\xfbn \xf5nxin de d\xf0\x8aim\xf0\x9b',
    captcha: '\xc8\xc8nzh\xe8ngm\x00\xa1',
    captchaPlaceholder: '\xf5\xf5\xedr\xfbn \xf5nxin de d\xf0\x8aim\xf0\x9b',
    refreshCaptcha: '\xe9\x01\x8cx\x10\x81n',
    signIn: '\xe9\xe9l\x00\xfa\xed'
  },
  ja: {
    title: '\xd4\x9b\xd4\x9b\x9e\x9b\x81',
    subtitle: '\xd4\x9b\xd4\x9b\x9e\x9b\x81h\x00\x00\xaak\x00\x00\x8au',
    username: '\xd4\x9b\xd4\x9b\x9e\x9b\x81m\x00\x00\x89\xd4\x9b\xd4\x9b',
    usernamePlaceholder: '\xf5\xf5\xedr\xfbn \xf5nxin de d\xf0\x8aim\xf0\x9b',
    password: '\xc8m\x00\xe0',
    passwordPlaceholder: '\xf5\xf5\xedr\xfbn \xf5nxin de d\xf0\x8aim\xf0\x9b',
    captcha: '\xc8\xc8nzh\xe8ngm\x00\xa1',
    captchaPlaceholder: '\xf5\xf5\xedr\xfbn \xf5nxin de d\xf0\x8aim\xf0\x9b',
    refreshCaptcha: '\xe9\x01\x8cx\x10\x81n',
    signIn: '\xe9\xe9l\x00\xfa\xed'
  },
  ko: {
    title: '\xd4\x9b\xd4\x9b\x9e\x9b\x81',
    subtitle: '\xd4\x9b\xd4\x9b\x9e\x9b\x81h\x00\x00\xaak\x00\x00\x8au',
    username: '\xd4\x9b\xd4\x9b\x9e\x9b\x81m\x00\x00\x89\xd4\x9b\xd4\x9b',
    usernamePlaceholder: '\xf5\xf5\xedr\xfbn \xf5nxin de d\xf0\x8aim\xf0\x9b',
    password: '\xc8m\x00\xe0',
    passwordPlaceholder: '\xf5\xf5\xedr\xfbn \xf5nxin de d\xf0\x8aim\xf0\x9b',
    captcha: '\xc8\xc8nzh\xe8ngm\x00\xa1',
    captchaPlaceholder: '\xf5\xf5\xedr\xfbn \xf5nxin de d\xf0\x8aim\xf0\x9b',
    refreshCaptcha: '\xe9\x01\x8cx\x10\x81n',
    signIn: '\xe9\xe9l\x00\xfa\xed'
  }
};

for (const lang of locales) {
  const data = JSON.parse(fs.readFileSync('./src/locales/' + lang + '.json', 'utf-8'));
  data.login = translations[lang];
  fs.writeFileSync('./src/locales/' + lang + '.json', JSON.stringify(data, null, 2));
  console.log(lang + ' done');
}
