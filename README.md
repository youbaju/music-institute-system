# نظام إدارة معهد الأنغام الموسيقي — نموذج أولي (Prototype)

نموذج عملي كامل بـ **HTML / CSS / JavaScript خالص** (بدون أي إطار عمل)، مبني بنمط
**Repository Pattern** بحيث يسهل ترحيله لاحقاً من بيانات تجريبية محلية إلى
**Firebase Firestore**، ثم مستقبلاً إلى أي قاعدة بيانات أخرى (مثل SQL Server)
دون التأثير على بقية التطبيق.

## طريقة التشغيل

المتصفحات تمنع تحميل ES Modules من `file://` مباشرة، لذلك شغّل خادماً محلياً
بسيطاً من داخل مجلد المشروع:

```bash
# باستخدام Python (موجود غالباً افتراضياً)
python3 -m http.server 8000

# أو باستخدام Node
npx serve .
```

ثم افتح `http://localhost:8000` في المتصفح.

**تسجيل الدخول التجريبي:** الصفحة الرئيسية تعرض اختيار دور (إدارة / طالب)
بدون كلمة مرور — هذا مقصود في مرحلة العرض الأولي فقط.

## هيكل المشروع

```
index.html            صفحة الدخول واختيار الدور
admin.html / js/admin.js     لوحة تحكم الإدارة (كل الوظائف)
student.html / js/student.js  بوابة الطالب/ولي الأمر (عرض فقط)
css/style.css          التصميم والهوية البصرية

js/config.js            نقطة التحكم بمصدر البيانات (local / firebase)
js/demo-data.js          البيانات التجريبية الأولية القابلة للتعديل بالكامل
js/services.js           منطق العمل (Business Logic) — يُستخدم من الصفحات
js/repository/
  ├── index.js               مصنع المستودعات (يقرر أي تنفيذ يُستخدم)
  ├── local-repository.js    تنفيذ محلي (localStorage) للعرض التجريبي
  └── firebase-repository.js تنفيذ حقيقي على Firestore (جاهز، غير مُفعّل)
```

## كيف تعمل طبقة Repository

كل الصفحات (`admin.js`, `student.js`) تستدعي فقط دوال `js/services.js`،
وهذه بدورها تستدعي `getRepository("اسم_المجموعة")` من `js/repository/index.js`
— ولا تعرف شيئاً عن كون البيانات في `localStorage` أو `Firestore`.

## الانتقال إلى Firebase حقيقي (بعد الاتفاق مع المعهد)

1. أنشئ مشروع Firebase جديد وفعّل Firestore
2. انسخ إعدادات المشروع إلى `js/config.js` داخل `firebase: {...}`
3. غيّر `dataSource: "local"` إلى `dataSource: "firebase"`
4. افتح `js/repository/index.js` واستبدل فرع `throw new Error(...)`
   باستيراد واستخدام `FirebaseRepository` (الملف جاهز بالفعل بنفس الواجهة تماماً)

لن تحتاج لتعديل أي شيء آخر في `services.js` أو الصفحات.

## الانتقال المستقبلي إلى SQL Server (أو أي قاعدة بيانات أخرى)

أنشئ ملف `js/repository/sql-repository.js` جديد بنفس الدوال الخمس
(`list, get, add, update, remove`) لكنه يتصل بواجهة API خلفية (Backend)
بدلاً من Firestore مباشرة، ثم بدّله في `index.js` بنفس الطريقة.

## ما لم يُبنَ بعد (مؤجَّل حسب وثيقة المتطلبات)

- بوابة الدفع الإلكتروني (Moyasar/PayTabs) — تسجيل المدفوعات حالياً يدوي
- تعارض حجز القاعات المتعددة (بانتظار تأكيد الحاجة من المعهد)
- نظام خصومات/باقات حصص
- مصادقة حقيقية (Firebase Authentication) بدلاً من اختيار الدور المباشر

## البيانات التجريبية

عند أول فتح للنظام، تُزرع بيانات تجريبية (طلاب، معلمون، حصص، فواتير) تلقائياً
في `localStorage`. لإعادة ضبطها، افتح أدوات المطور في المتصفح ونفّذ:

```js
localStorage.clear(); location.reload();
```
