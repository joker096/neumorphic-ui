/**
 * Alias tables for competitor / spreadsheet headers (lowercase keys; headers are
 * normalised to lowercase before lookup).
 */

export const NAME_ALIASES = [
  'name', 'fullname', 'full name', 'displayname', 'display name', 'contact',
  'contactname', 'client', 'clientname', 'customer', 'фио', 'имя', 'контакт', 'клиент',
];
export const FIRST_ALIASES = ['firstname', 'имя'];
export const LAST_ALIASES = ['lastname', 'фамилия'];
export const PHONE_ALIASES = ['phone', 'tel', 'telephone', 'mobile', 'phone number', 'мобильный', 'телефон', 'номер'];
export const EMAIL_ALIASES = ['email', 'e-mail', 'mail', 'email address', 'почта', 'емейл'];
export const STATUS_ALIASES = ['status', 'state', 'type', 'статус', 'тип', 'статус клиента'];
export const TAGS_ALIASES = ['tags', 'tag', 'labels', 'label', 'category', 'categories', 'group', 'groups', 'теги', 'категория', 'группа'];
export const TITLE_ALIASES = ['title', 'position', 'job', 'jobtitle', 'role', 'должность', 'позиция'];
export const NOTES_ALIASES = ['notes', 'note', 'comment', 'comments', 'description', 'описание', 'комментарий', 'заметки'];

export const DEAL_SPECIFIC_ALIASES = [
  'deal', 'dealtitle', 'deal title', 'offer', 'opportunity', 'сделка',
  'название сделки', 'предложение', 'commercial',
];
export const DEAL_TITLE_FALLBACK = ['title', 'name', 'offer'];
export const AMOUNT_ALIASES = ['amount', 'sum', 'total', 'value', 'price', 'budget', 'cost', 'сумма', 'стоимость', 'бюджет', 'цена'];
export const STAGE_ALIASES = ['stage', 'phase', 'status', 'step', 'стадия', 'этап', 'статус сделки'];
export const DEAL_NOTES_ALIASES = ['dealnotes', 'deal notes', 'dealdescription', 'описание сделки'];
export const DEAL_CLOSE_ALIASES = ['expectedclose', 'expected close', 'closedate', 'close date', 'duedate', 'дата закрытия', 'план закрытия'];
export const DEAL_CONTACT_ALIASES = ['contact', 'contactid', 'contactemail', 'client', 'clientname', 'customer', 'customername', 'email', 'phone', 'имя клиента', 'контакт'];

export const TASK_SPECIFIC_ALIASES = ['task', 'tasktitle', 'task title', 'todo', 'action', 'activity', 'задача', 'название задачи', 'дело'];
export const TASK_CONTACT_ALIASES = ['contact', 'client', 'customer', 'email', 'phone', 'контакт', 'клиент'];
export const TASK_DEAL_ALIASES = ['deal', 'dealname', 'сделка'];
export const TASK_PRIORITY_ALIASES = ['priority', 'prio', 'важность', 'приоритет'];
export const TASK_DUE_ALIASES = ['due', 'duedate', 'deadline', 'due date', 'дата', 'срок', 'дедлайн'];
export const TASK_DONE_ALIASES = ['done', 'complete', 'completed', 'finished', 'готово', 'выполнено'];