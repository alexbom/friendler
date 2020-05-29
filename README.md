# Пример JavaScript кода из проекта https://friendler.ru

![Friendler](https://friendler.ru/dist/img/friendler.png)

## Френдлер - это поиск друзей по интересам

Проект разрабатывается для души в свободное время совместно с PHP-программистом.

### Используемые технологии

1. **ReactXP** - _надстройка над React Native от Microsoft_
1. **WebPack** - _сборщик проекта_
1. **TypeScript** - _типизированный JavaScript_
1. **Redux** - _для централизации данных_
1. **YMaps API** - _Яндекс-карты, чтобы искать друзей поблизости_
1. **WebSocket** - _для чата между пользователями_
1. **SocialAuth** - _авторизация через соц. сети_

### Технические особенности

1. Проект является кросс-платформенным, поэтому кодовая база веб-версии будет переиспользована для создания мобильных приложений на Android & iOS.
1. CSS-in-JS - стили компонентов формируются с помощью JavaScript-функций, таких как adaptive & conditions (см. services/Style.ts).
1. Почти все данные, получаемые с сервера, сохраняются не только в Redux Store, но и в LocalStorage, благодаря чему сокращена нагрузка на сервер и достигнут молниеносный переход между страницами.

### Александр Бом: http://tihoemesto.ru
