import type { Dict } from "../types";

/**
 * legal: Privacy Policy (legal.pp.*) and Terms of Service (legal.tos.*). Written to match what the code actually does
 * (see src/lib/sync.ts, src/lib/auth.ts, src/app/api/support). Update the text and `legal.updated` when that changes.
 * Section layout lives in src/components/shared/LegalPage.tsx: legal.<doc>.<n>.t is the heading, .p the paragraph,
 * .li1..liN optional bullet points. Khmer is AI-drafted and not reviewed by a lawyer or native speaker.
 */
const messages = {
  "legal.updated": { en: "Last updated: {date}", km: "កែប្រែចុងក្រោយ៖ {date}" },
  "legal.date": { en: "13 November 2026", km: "ថ្ងៃទី 13 ខែវិច្ឆិកា ឆ្នាំ 2026" },
  "legal.contents": { en: "On this page", km: "នៅលើទំព័រនេះ" },
  "legal.questions": { en: "Questions? Email {email} or use the contact form.", km: "មានសំណួរ? សូមផ្ញើអ៊ីមែលទៅ {email} ឬប្រើទម្រង់ទំនាក់ទំនង។" },
  "legal.contactForm": { en: "Contact form", km: "ទម្រង់ទំនាក់ទំនង" },
  "legal.seeTerms": { en: "Terms of Service", km: "លក្ខខណ្ឌប្រើប្រាស់" },
  "legal.seePrivacy": { en: "Privacy Policy", km: "គោលការណ៍ឯកជនភាព" },

  // ---- Privacy Policy -------------------------------------------------------
  "legal.pp.title": { en: "Privacy Policy", km: "គោលការណ៍ឯកជនភាព" },
  "legal.pp.intro": { en: "DL Typing is a free typing school for English and Khmer. This page explains what information the site keeps, where it is kept and what you can do about it, in plain language.", km: "DL Typing គឺជាសាលាវាយអក្សរឥតគិតថ្លៃ សម្រាប់ភាសាអង់គ្លេស និងខ្មែរ។ ទំព័រនេះពន្យល់ជាភាសាសាមញ្ញថា តើគេហទំព័ររក្សាព័ត៌មានអ្វីខ្លះ រក្សាទុកនៅឯណា និងអ្វីដែលអ្នកអាចធ្វើបាន។" },

  "legal.pp.1.t": { en: "The short version", km: "សេចក្តីសង្ខេប" },
  "legal.pp.1.li1": { en: "You can learn, practise and play without an account.", km: "អ្នកអាចរៀន ហាត់ និងលេងហ្គេម ដោយមិនចាំបាច់មានគណនី។" },
  "legal.pp.1.li2": { en: "There are no ads, no advertising or tracking cookies and no third-party analytics.", km: "គ្មានការផ្សាយពាណិជ្ជកម្ម គ្មានខូគីផ្សាយពាណិជ្ជកម្ម ឬតាមដាន និងគ្មានការវិភាគពីភាគីទីបី។" },
  "legal.pp.1.li3": { en: "We never sell or rent your information.", km: "យើងមិនដែលលក់ ឬជួលព័ត៌មានរបស់អ្នកឡើយ។" },
  "legal.pp.1.li4": { en: "You can ask us to delete anything stored about you.", km: "អ្នកអាចស្នើឱ្យយើងលុបអ្វីៗដែលបានរក្សាទុកអំពីអ្នក។" },

  "legal.pp.2.t": { en: "Stored in your browser", km: "រក្សាទុកក្នុងកម្មវិធីរុករករបស់អ្នក" },
  "legal.pp.2.p": { en: "Most of your progress lives in your browser's local storage on this device: completed lessons and XP, scores and game levels, typing sessions (speed, accuracy, time), per-key statistics, pets, and settings such as language, theme and keyboard. It also holds a random device ID that is not linked to your name. Clearing your browser data, or using Reset on the dashboard, removes it.", km: "វឌ្ឍនភាពភាគច្រើនរបស់អ្នក ត្រូវបានរក្សាទុកក្នុង local storage នៃកម្មវិធីរុករក នៅលើឧបករណ៍នេះ៖ មេរៀនដែលបានបញ្ចប់ និង XP ពិន្ទុ និងកម្រិតហ្គេម ការហាត់វាយអក្សរ (ល្បឿន ភាពត្រឹមត្រូវ រយៈពេល) ស្ថិតិតាមគ្រាប់ចុច សត្វចិញ្ចឹម និងការកំណត់ដូចជា ភាសា រចនាប័ទ្ម និងក្តារចុច។ វាក៏រក្សាលេខសម្គាល់ឧបករណ៍ចៃដន្យមួយ ដែលមិនភ្ជាប់ទៅនឹងឈ្មោះរបស់អ្នក។ ការសម្អាតទិន្នន័យកម្មវិធីរុករក ឬការប្រើ Reset នៅលើផ្ទាំងគ្រប់គ្រង នឹងលុបវាចោល។" },

  "legal.pp.3.t": { en: "Stored on our server", km: "រក្សាទុកនៅលើម៉ាស៊ីនមេរបស់យើង" },
  "legal.pp.3.p": { en: "So your progress is not lost and can follow you to other devices, the site sends a copy to our database:", km: "ដើម្បីកុំឱ្យវឌ្ឍនភាពរបស់អ្នកបាត់បង់ ហើយអាចប្រើបាននៅលើឧបករណ៍ផ្សេងទៀត គេហទំព័រផ្ញើច្បាប់ចម្លងមួយទៅកាន់មូលដ្ឋានទិន្នន័យរបស់យើង៖" },
  "legal.pp.3.li1": { en: "Without an account: your random device ID with best scores, lesson and game levels, practice bests, per-key statistics and settings. Nothing that names you.", km: "គ្មានគណនី៖ លេខសម្គាល់ឧបករណ៍ចៃដន្យរបស់អ្នក ជាមួយពិន្ទុល្អបំផុត កម្រិតមេរៀន និងហ្គេម លទ្ធផលហាត់ល្អបំផុត ស្ថិតិតាមគ្រាប់ចុច និងការកំណត់។ គ្មានអ្វីដែលបញ្ជាក់ឈ្មោះរបស់អ្នកទេ។" },
  "legal.pp.3.li2": { en: "With an account: also your name, email address and password. The password is stored only as a secure hash; we cannot read it.", km: "មានគណនី៖ បន្ថែមលើនោះ ឈ្មោះ អាសយដ្ឋានអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នក។ ពាក្យសម្ងាត់ត្រូវបានរក្សាទុកតែជា hash សុវត្ថិភាពប៉ុណ្ណោះ យើងមិនអាចអានវាបានទេ។" },
  "legal.pp.3.li3": { en: "When you sign up or sign in: a short-lived counter tied to your IP address, used only to slow down password guessing.", km: "ពេលអ្នកចុះឈ្មោះ ឬចូលគណនី៖ អ្នករាប់រយៈពេលខ្លីមួយ ដែលភ្ជាប់នឹងអាសយដ្ឋាន IP របស់អ្នក ប្រើតែដើម្បីបន្ថយការទាយពាក្យសម្ងាត់ប៉ុណ្ណោះ។" },

  "legal.pp.4.t": { en: "Messages you send us", km: "សារដែលអ្នកផ្ញើមកយើង" },
  "legal.pp.4.p": { en: "When you use Contact, Feedback or Report a Problem, we keep what you type (name, email, subject, message and any details), the page you were on, your browser's user-agent string and any file you attach. A copy is emailed to the site owner so we can reply. We use it only to answer you and improve the site.", km: "នៅពេលអ្នកប្រើ ទំនាក់ទំនង មតិកែលម្អ ឬរាយការណ៍បញ្ហា យើងរក្សាអ្វីដែលអ្នកវាយ (ឈ្មោះ អ៊ីមែល ប្រធានបទ សារ និងព័ត៌មានលម្អិត) ទំព័រដែលអ្នកកំពុងនៅ ព័ត៌មានកម្មវិធីរុករក (user-agent) និងឯកសារដែលអ្នកភ្ជាប់។ ច្បាប់ចម្លងមួយត្រូវបានផ្ញើតាមអ៊ីមែលទៅម្ចាស់គេហទំព័រ ដើម្បីឆ្លើយតប។ យើងប្រើវាតែដើម្បីឆ្លើយអ្នក និងកែលម្អគេហទំព័រប៉ុណ្ណោះ។" },

  "legal.pp.5.t": { en: "Cookies", km: "ខូគី" },
  "legal.pp.5.p": { en: "The site sets one cookie, and only when you sign in: a secure session cookie that keeps you signed in for up to 30 days. It is removed when you sign out. There are no advertising, analytics or third-party cookies.", km: "គេហទំព័រកំណត់ខូគីតែមួយ ហើយតែនៅពេលអ្នកចូលគណនីប៉ុណ្ណោះ៖ ខូគីវគ្គសុវត្ថិភាព ដែលរក្សាឱ្យអ្នកនៅក្នុងគណនីរហូតដល់ 30 ថ្ងៃ។ វាត្រូវបានលុបនៅពេលអ្នកចាកចេញ។ គ្មានខូគីផ្សាយពាណិជ្ជកម្ម វិភាគ ឬខូគីភាគីទីបីទេ។" },

  "legal.pp.6.t": { en: "Services we rely on", km: "សេវាកម្មដែលយើងពឹងផ្អែក" },
  "legal.pp.6.p": { en: "We share data only with the companies that run the site for us, and only what they need:", km: "យើងចែករំលែកទិន្នន័យតែជាមួយក្រុមហ៊ុនដែលដំណើរការគេហទំព័រជំនួសយើងប៉ុណ្ណោះ ហើយតែអ្វីដែលពួកគេត្រូវការ៖" },
  "legal.pp.6.li1": { en: "Vercel hosts the website. Like any web host it may keep short-term server logs, including IP addresses.", km: "Vercel បង្ហោះគេហទំព័រ។ ដូចម៉ាស៊ីនបង្ហោះគេហទំព័រដទៃទៀត វាអាចរក្សាកំណត់ហេតុម៉ាស៊ីនមេរយៈពេលខ្លី រួមទាំងអាសយដ្ឋាន IP។" },
  "legal.pp.6.li2": { en: "Neon hosts the database described above.", km: "Neon បង្ហោះមូលដ្ឋានទិន្នន័យដែលបានរៀបរាប់ខាងលើ។" },
  "legal.pp.6.li3": { en: "An email provider (Gmail or Resend) sends verification codes and copies of support messages.", km: "អ្នកផ្តល់សេវាអ៊ីមែល (Gmail ឬ Resend) ផ្ញើលេខកូដផ្ទៀងផ្ទាត់ និងច្បាប់ចម្លងសារជំនួយ។" },

  "legal.pp.7.t": { en: "How long we keep it, and your choices", km: "រយៈពេលរក្សាទុក និងជម្រើសរបស់អ្នក" },
  "legal.pp.7.p": { en: "We keep your progress and account while you use the site, and support messages for as long as they are useful for answering you. You can at any time:", km: "យើងរក្សាវឌ្ឍនភាព និងគណនីរបស់អ្នក ពេលអ្នកកំពុងប្រើគេហទំព័រ ហើយរក្សាសារជំនួយ ដរាបណាវានៅមានប្រយោជន៍សម្រាប់ឆ្លើយតបអ្នក។ អ្នកអាចធ្វើបានគ្រប់ពេល៖" },
  "legal.pp.7.li1": { en: "clear the progress on this device from the dashboard or your browser settings;", km: "សម្អាតវឌ្ឍនភាពលើឧបករណ៍នេះ ពីផ្ទាំងគ្រប់គ្រង ឬការកំណត់កម្មវិធីរុករករបស់អ្នក។" },
  "legal.pp.7.li2": { en: "ask for a copy of what we store about you;", km: "ស្នើសុំច្បាប់ចម្លងនៃអ្វីដែលយើងរក្សាទុកអំពីអ្នក។" },
  "legal.pp.7.li3": { en: "ask us to correct it, or to delete your account and all server data linked to it.", km: "ស្នើឱ្យយើងកែតម្រូវវា ឬលុបគណនីរបស់អ្នក និងទិន្នន័យទាំងអស់នៅលើម៉ាស៊ីនមេដែលភ្ជាប់ជាមួយវា។" },
  "legal.pp.7.p2": { en: "Email us from the address on your account and we will handle it within 30 days.", km: "សូមផ្ញើអ៊ីមែលមកយើងពីអាសយដ្ឋានក្នុងគណនីរបស់អ្នក ហើយយើងនឹងដោះស្រាយក្នុងរយៈពេល 30 ថ្ងៃ។" },

  "legal.pp.8.t": { en: "Children", km: "កុមារ" },
  "legal.pp.8.p": { en: "DL Typing is made for learners of all ages, and children can use it without an account. Children under 13 should ask a parent, guardian or teacher before creating an account or sending us a message. If you believe a child has given us personal information without permission, contact us and we will delete it.", km: "DL Typing ត្រូវបានបង្កើតឡើងសម្រាប់អ្នករៀនគ្រប់វ័យ ហើយកុមារអាចប្រើវាដោយគ្មានគណនី។ កុមារអាយុក្រោម 13 ឆ្នាំ គួរសុំការអនុញ្ញាតពីឪពុកម្តាយ អាណាព្យាបាល ឬគ្រូ មុនពេលបង្កើតគណនី ឬផ្ញើសារមកយើង។ ប្រសិនបើអ្នកគិតថាកុមារម្នាក់បានផ្តល់ព័ត៌មានផ្ទាល់ខ្លួនដោយគ្មានការអនុញ្ញាត សូមទាក់ទងមកយើង ហើយយើងនឹងលុបវាចោល។" },

  "legal.pp.9.t": { en: "Changes to this policy", km: "ការផ្លាស់ប្តូរគោលការណ៍នេះ" },
  "legal.pp.9.p": { en: "If the site starts collecting something new, we will update this page and the date at the top before it happens.", km: "ប្រសិនបើគេហទំព័រចាប់ផ្តើមប្រមូលអ្វីថ្មី យើងនឹងធ្វើបច្ចុប្បន្នភាពទំព័រនេះ និងកាលបរិច្ឆេទខាងលើ មុនពេលវាកើតឡើង។" },

  // ---- Terms of Service -----------------------------------------------------
  "legal.tos.title": { en: "Terms of Service", km: "លក្ខខណ្ឌប្រើប្រាស់" },
  "legal.tos.intro": { en: "These terms are the rules for using DL Typing. By using the site you agree to them. They are short on purpose.", km: "លក្ខខណ្ឌទាំងនេះ គឺជាច្បាប់សម្រាប់ការប្រើប្រាស់ DL Typing។ ដោយការប្រើគេហទំព័រ អ្នកយល់ព្រមតាមលក្ខខណ្ឌទាំងនេះ។ វាខ្លីដោយចេតនា។" },

  "legal.tos.1.t": { en: "Using DL Typing", km: "ការប្រើប្រាស់ DL Typing" },
  "legal.tos.1.p": { en: "DL Typing is free for personal, classroom and educational use. Teachers and schools are welcome to use it with their students.", km: "DL Typing ឥតគិតថ្លៃ សម្រាប់ការប្រើប្រាស់ផ្ទាល់ខ្លួន ក្នុងថ្នាក់រៀន និងការអប់រំ។ គ្រូ និងសាលារៀនត្រូវបានស្វាគមន៍ឱ្យប្រើវាជាមួយសិស្សរបស់ពួកគេ។" },

  "legal.tos.2.t": { en: "Your account", km: "គណនីរបស់អ្នក" },
  "legal.tos.2.p": { en: "An account is optional. If you create one, give a real email address, keep your password private and tell us if you think someone else has used it. You are responsible for what happens under your account.", km: "គណនីមិនមែនជាកាតព្វកិច្ចទេ។ ប្រសិនបើអ្នកបង្កើតគណនី សូមប្រើអាសយដ្ឋានអ៊ីមែលពិត រក្សាពាក្យសម្ងាត់ជាឯកជន ហើយប្រាប់យើងប្រសិនបើអ្នកគិតថាមាននរណាម្នាក់ផ្សេងបានប្រើវា។ អ្នកទទួលខុសត្រូវចំពោះអ្វីដែលកើតឡើងក្រោមគណនីរបស់អ្នក។" },

  "legal.tos.3.t": { en: "Fair use", km: "ការប្រើប្រាស់ដោយយុត្តិធម៌" },
  "legal.tos.3.p": { en: "Please do not:", km: "សូមកុំ៖" },
  "legal.tos.3.li1": { en: "try to break, overload or get unauthorised access to the site or its database;", km: "ព្យាយាមបំផ្លាញ ធ្វើឱ្យលើសទម្ងន់ ឬចូលដោយគ្មានការអនុញ្ញាត ទៅកាន់គេហទំព័រ ឬមូលដ្ឋានទិន្នន័យរបស់វា។" },
  "legal.tos.3.li2": { en: "use bots or scripts to fake scores or progress;", km: "ប្រើ bot ឬស្គ្រីប ដើម្បីក្លែងបន្លំពិន្ទុ ឬវឌ្ឍនភាព។" },
  "legal.tos.3.li3": { en: "send messages or attachments that are abusive, illegal or harmful.", km: "ផ្ញើសារ ឬឯកសារភ្ជាប់ដែលប្រមាថ ខុសច្បាប់ ឬបង្កគ្រោះថ្នាក់។" },
  "legal.tos.3.p2": { en: "We may remove content or close an account that breaks these rules.", km: "យើងអាចលុបខ្លឹមសារ ឬបិទគណនីដែលបំពានច្បាប់ទាំងនេះ។" },

  "legal.tos.4.t": { en: "Content", km: "ខ្លឹមសារ" },
  "legal.tos.4.p": { en: "The lessons, texts, games, artwork and code of DL Typing belong to DL Typing. You may use them to learn and to teach, but please do not copy them to publish or sell elsewhere. Anything you send us (such as feedback) we may use to improve the site.", km: "មេរៀន អត្ថបទ ហ្គេម រូបភាព និងកូដរបស់ DL Typing ជាកម្មសិទ្ធិរបស់ DL Typing។ អ្នកអាចប្រើវាដើម្បីរៀន និងបង្រៀន ប៉ុន្តែសូមកុំចម្លងវាដើម្បីបោះពុម្ព ឬលក់នៅកន្លែងផ្សេង។ អ្វីដែលអ្នកផ្ញើមកយើង (ដូចជាមតិកែលម្អ) យើងអាចប្រើដើម្បីកែលម្អគេហទំព័រ។" },

  "legal.tos.5.t": { en: "Progress and scores", km: "វឌ្ឍនភាព និងពិន្ទុ" },
  "legal.tos.5.p": { en: "We work hard to keep your progress safe, but it is stored mostly in your browser and we cannot guarantee it will never be lost. XP, streaks, pets and scores are for motivation; they have no money value.", km: "យើងខិតខំរក្សាវឌ្ឍនភាពរបស់អ្នកឱ្យមានសុវត្ថិភាព ប៉ុន្តែវាត្រូវបានរក្សាទុកភាគច្រើនក្នុងកម្មវិធីរុករករបស់អ្នក ហើយយើងមិនអាចធានាថាវានឹងមិនបាត់បង់ទេ។ XP ថ្ងៃជាប់ៗគ្នា សត្វចិញ្ចឹម និងពិន្ទុ គឺសម្រាប់ការលើកទឹកចិត្ត ពួកវាគ្មានតម្លៃជាប្រាក់ទេ។" },

  "legal.tos.6.t": { en: "No warranty", km: "គ្មានការធានា" },
  "legal.tos.6.p": { en: "DL Typing is provided as it is, free of charge. We may change, pause or remove features at any time. As far as the law allows, we are not liable for any loss that comes from using or not being able to use the site.", km: "DL Typing ត្រូវបានផ្តល់ជូនតាមស្ថានភាពដែលវាមាន ដោយឥតគិតថ្លៃ។ យើងអាចផ្លាស់ប្តូរ ផ្អាក ឬលុបមុខងារនានាបានគ្រប់ពេល។ ក្នុងកម្រិតដែលច្បាប់អនុញ្ញាត យើងមិនទទួលខុសត្រូវចំពោះការខាតបង់ណាមួយ ដែលកើតចេញពីការប្រើប្រាស់ ឬការមិនអាចប្រើប្រាស់គេហទំព័រនោះទេ។" },

  "legal.tos.7.t": { en: "Changes to these terms", km: "ការផ្លាស់ប្តូរលក្ខខណ្ឌទាំងនេះ" },
  "legal.tos.7.p": { en: "We may update these terms. The date at the top shows the latest version; continuing to use the site means you accept it.", km: "យើងអាចធ្វើបច្ចុប្បន្នភាពលក្ខខណ្ឌទាំងនេះ។ កាលបរិច្ឆេទខាងលើបង្ហាញកំណែចុងក្រោយ ការបន្តប្រើគេហទំព័រមានន័យថាអ្នកទទួលយកវា។" },
} satisfies Dict;
export default messages;
