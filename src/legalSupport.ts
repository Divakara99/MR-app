export const SUPPORT_EMAIL = 'akhildivakara@gmail.com'
export const LEGAL_POLICY_DATE = '20 October 2026'

export const SUPPORT_TICKET_REASONS = [
  'Login / account issue',
  'Job Seeker profile issue',
  'Job application / Apply Now issue',
  'Subscription / sponsored ad issue',
  'Recruiter vacancy approval issue',
  'Wrong vacancy details / report a job',
  'Candidate contact request issue',
  'Account deletion help',
  'Privacy / personal data request',
  'Technical problem in the app',
  'Other proper reason',
]

export type LegalSection = {
  title: string
  intro?: string
  bullets: string[]
}

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '1. Who We Are',
    bullets: [
      'PharmaSales Jobs — The MR to NSM Jobs Network — is a pharma field-force vacancy platform operating since 2026 for roles from Trainee MR and Field MR to Senior MR, ASM, RSM, ZSM and NSM.',
      'The app is managed by M Divakar Reddy, App Founder — PharmaSales Jobs.',
      `For privacy questions, data requests or support, email ${SUPPORT_EMAIL} or raise a support ticket from the AI Assistant section in the app.`,
    ],
  },
  {
    title: '2. Information We Collect',
    bullets: [
      'Account information: your full name, 10-digit mobile number, email ID, selected role (Job Seeker or Recruiter) and account creation details.',
      'Job Seeker profile information: Fresher or Experienced status, desired role, qualification, passing year for Freshers, total experience, current company, current role, current package, expected package, State, City, current HQ, preferred HQ, notice period or joining availability, two-wheeler availability and skills.',
      'Recruiter and vacancy information: company name, job title, division, role, State, City, HQ, experience required, CTC, openings, qualification, job description, contact-person name, contact number, email ID and urgency.',
      'App activity: saved jobs, applications started or submitted through the app, contact reveals, daily unlock counts, selected plan, profile completion status, account-deletion requests and candidate contact requests.',
      'Support and AI information: the name, mobile number, email ID, reason category, subject and detailed explanation you submit in a support ticket, plus the questions you type into the AI Assistant.',
      'Technical information: browser or device information, app usage, error details, local storage/session data and basic security logs needed to operate and improve the app.',
    ],
  },
  {
    title: '3. How We Use Your Information',
    bullets: [
      'To create and maintain your Job Seeker or Recruiter account and keep you logged in on your device until you choose Logout.',
      'To match Job Seekers with suitable pharma field-force vacancies and to help Recruiters find suitable candidates by role, experience, company background, package and HQ/territory.',
      'To review recruiter-submitted vacancies before they go LIVE and to review Job Seeker account-deletion requests submitted with a proper reason.',
      'To operate saved jobs, applications, contact reveals, daily Free-plan limits, sponsored-ad unlocks, paid-plan features and candidate contact requests.',
      'To respond to support tickets and emails, prevent spam or misuse, protect user privacy, fix technical problems and improve the app experience.',
      'To send important account, vacancy, approval, application or support communications related to your use of the app.',
    ],
  },
  {
    title: '4. Job Seeker Profile Privacy',
    bullets: [
      'Registered Recruiters can view anonymous Job Seeker job-fit information such as desired role, Fresher or Experienced status, experience, current company, current role, current package, expected package, qualification, State, City, HQ, notice period, two-wheeler availability and skills.',
      'Your name, mobile number and email ID are not shown to Recruiters in the anonymous candidate profile directory.',
      'A Recruiter cannot directly call, WhatsApp or email you from the anonymous profile. Candidate contact requests go through Admin, and your contact details should be shared only after Admin review and your consent.',
      'Please keep your profile accurate. Incorrect experience, company, package or HQ details can reduce trust and may lead to correction, restriction or removal of the profile.',
    ],
  },
  {
    title: '5. Recruiter Vacancy & Contact Privacy',
    bullets: [
      'Recruiter-submitted vacancies are reviewed by Admin M Divakar Reddy before they go LIVE.',
      'Approved vacancy details such as company, role, division, HQ, experience, CTC and qualification may be displayed to Job Seekers.',
      'Recruiter contact details are privacy-masked by default and are revealed only under the applicable plan or sponsored-ad unlock rules.',
      'Recruiters must provide genuine vacancy and contact information and must use candidate information only for legitimate hiring purposes.',
    ],
  },
  {
    title: '6. Ads, Plans & Unlock Information',
    bullets: [
      'Free users can use sponsored-ad unlocks for the first 3 daily jobs. Completing those unlocks can open 7 extra daily jobs.',
      'On extra Free jobs, company name, manager/contact-person name, contact number and Apply Now may each require a separate sponsored ad.',
      'Apply Now plays a sponsored ad for Free, Starter and Pro users before the application is submitted. Starter and Pro users otherwise receive direct contact reveals without browsing or reveal ads, as described in the app.',
      'We store daily reveal and unlock status so completed reveals remain available for that day and reset correctly on the next day.',
      'Advertising or analytics partners, when enabled in a production version, may process limited device or ad-interaction information under their own policies. We do not sell your name, mobile number or email ID to advertisers.',
    ],
  },
  {
    title: '7. AI Assistant & Support Tickets',
    bullets: [
      'Questions typed into the AI Assistant are processed to generate career, resume, interview, vacancy and app-guidance responses.',
      'Do not enter passwords, OTPs, bank details, Aadhaar/PAN numbers, medical details or any other highly sensitive information into AI Chat or a support ticket.',
      'When you raise a support ticket, you must select a proper reason and explain the issue clearly. We use the ticket details and your contact information to investigate and respond.',
      `You may also contact support directly at ${SUPPORT_EMAIL}. Include your registered mobile number and ticket number, if available, so Admin can identify your request quickly.`,
    ],
  },
  {
    title: '8. When Information Is Shared',
    bullets: [
      'With Recruiters: only anonymous Job Seeker job-fit details described in this policy; direct contact details require the Admin/consent process.',
      'With Job Seekers: approved vacancy details and recruiter contact details only after the applicable reveal or unlock step.',
      'With service providers: hosting, database, AI, email, analytics, security or advertising providers only as needed to operate the app.',
      'For safety or legal reasons: if needed to prevent fraud, spam, harassment or misuse, enforce our Terms, protect users or comply with applicable law.',
      'We do not sell your personal information.',
    ],
  },
  {
    title: '9. Cookies, Local Storage & Persistent Login',
    bullets: [
      'The app uses local storage and similar browser storage to remember your session, plan, saved jobs, applications, contact reveals, daily unlocks, preferences and account-related requests on your device.',
      'If you remain logged in, the app can reopen your account without asking for your mobile number each time. Use Logout when using a shared or public device.',
      'Clearing browser/app storage may sign you out and may remove locally stored preferences, saved activity or ticket history shown on that device.',
    ],
  },
  {
    title: '10. Data Storage, Retention & Security',
    bullets: [
      'Account and profile information is retained while your account is active and for a reasonable period needed for support, safety, dispute handling and legal or operational records.',
      'Support tickets and important account-request records may be retained after resolution so Admin can review the history of a request.',
      'We use reasonable technical and organisational safeguards, access controls and privacy masking to protect personal information, but no internet system can be guaranteed completely secure.',
      'You are responsible for protecting access to your mobile number, email account and logged-in device.',
    ],
  },
  {
    title: '11. Your Choices & Data Rights',
    bullets: [
      'You can review and update your Job Seeker profile from the Profile section of the app.',
      'You can log out at any time. Recruiters can directly delete their Recruiter account from the app, subject to the rules shown during deletion.',
      'Job Seekers can request account deletion only with a proper reason. Admin reviews the request and deletes the account only when the reason is valid.',
      `For access, correction, privacy or deletion help, raise a support ticket through AI Assistant or email ${SUPPORT_EMAIL} from your registered email ID where possible.`,
      'We may ask for your registered mobile number or other reasonable verification details before acting on a privacy request.',
    ],
  },
  {
    title: '12. Children & External Links',
    bullets: [
      'PharmaSales Jobs is intended for users who are 18 years or older and are seeking or offering employment.',
      'The app may link to phone, WhatsApp, email or external company services. Their privacy practices are governed by their own policies, and we are not responsible for external websites or apps.',
      'Never pay money to any person promising a job. Report suspicious vacancy or payment requests through the support ticket option in AI Assistant.',
    ],
  },
  {
    title: '13. Policy Updates & Contact',
    bullets: [
      `This Privacy Policy is effective from ${LEGAL_POLICY_DATE}. We may update it when app features, legal requirements or data practices change.`,
      'The latest version will be available inside the app under Legal & Support → Privacy Policy.',
      `Privacy contact: M Divakar Reddy, App Founder — PharmaSales Jobs • Support email: ${SUPPORT_EMAIL}.`,
    ],
  },
]

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Acceptance & Eligibility',
    bullets: [
      'By using PharmaSales Jobs, you agree to these Terms & Privacy conditions and the Privacy Policy available inside the app.',
      'You must be at least 18 years old and legally capable of seeking or offering employment in India.',
      'You must provide true, current and complete information and update it when it changes.',
    ],
  },
  {
    title: '2. Accounts & Mobile Login',
    bullets: [
      'First-time registration requires your full name, correct 10-digit mobile number and correct email ID. After registration, returning login is by mobile number only; no password is used for Job Seeker or Recruiter accounts.',
      'Once logged in, your session may remain active on your device until you choose Logout. You are responsible for activity performed through your logged-in device and registered mobile number.',
      'A mobile number used for an active Recruiter account cannot be used for Job Seeker login or registration until that Recruiter account is deleted.',
      'Do not create an account for another person, use a mobile number or email ID you do not control, or create duplicate or misleading accounts.',
    ],
  },
  {
    title: '3. Job Seeker Profiles & Applications',
    bullets: [
      'Job Seekers must complete the required profile information. Freshers must use the Fresher profile path; experienced candidates must provide experience, current company, current role and package details.',
      'Your profile and application information must be honest. False qualification, experience, company, package or availability details may result in rejection by Recruiters or restriction by Admin.',
      'Applying through the app does not guarantee an interview, selection, offer letter, salary or joining. Final hiring decisions belong to the company or Recruiter.',
      'You are responsible for verifying the company, vacancy, interview venue, job role, salary, allowances and offer terms before joining.',
    ],
  },
  {
    title: '4. Recruiter Vacancies & Admin Approval',
    bullets: [
      'Recruiters may submit vacancies free of cost. Every recruiter-submitted vacancy remains pending until Admin M Divakar Reddy verifies and approves it.',
      'Recruiters must submit only genuine vacancies they are authorised to fill and must provide accurate company, role, HQ, CTC, qualification and contact details.',
      'Admin may edit, reject, pause or remove a vacancy that is incomplete, duplicate, misleading, expired, discriminatory, unsafe or otherwise unsuitable.',
      'Recruiters must not charge Job Seekers any registration, training, document, security-deposit or placement fee through this app unless clearly authorised by law and approved by Admin in writing.',
    ],
  },
  {
    title: '5. Candidate Privacy & Recruiter Conduct',
    bullets: [
      'Candidate profiles shown to Recruiters are anonymous. Name, mobile number and email ID are hidden.',
      'Recruiters may use anonymous profile information only to assess job fit and request contact through Admin.',
      'Recruiters must not attempt to identify, scrape, copy, sell, spam or misuse candidate profiles or contact information.',
      'Candidate contact details, if shared after Admin review and candidate consent, may be used only for the relevant genuine hiring opportunity.',
    ],
  },
  {
    title: '6. Vacancy Verification & Job Safety',
    bullets: [
      'Vacancies are reviewed before going LIVE, but PharmaSales Jobs cannot guarantee that every company, recruiter, salary, vacancy or interview claim is complete or remains available.',
      'Never pay money for a job, interview, offer letter, ID card, training kit or joining process. Genuine employers should not ask candidates to make such payments.',
      'Do not share bank details, OTPs, passwords or unnecessary original documents with any recruiter.',
      `Report a wrong or suspicious vacancy through the AI Assistant support ticket option or email ${SUPPORT_EMAIL}.`,
    ],
  },
  {
    title: '7. Plans, Sponsored Ads & Contact Unlocks',
    bullets: [
      'Free users receive 3 daily full-contact job unlocks through sponsored ads. After completing those 3 unlocks, up to 7 extra jobs may be shown for that day.',
      'On extra Free jobs, separate sponsored ads may be required to reveal the company name, manager/contact-person name and contact number, and to use Apply Now.',
      'Apply Now requires one sponsored ad on Free, Starter and Pro plans before submission. Cancelling the ad cancels the application submission for that attempt.',
      'Starter and Pro plans provide the direct browsing/contact-reveal benefits described on the Pricing page. Plan features, limits and pricing may change with notice inside the app.',
      'Unlocks are for your personal job-search or hiring use only. Do not sell, publish or mass-share revealed contact numbers or email IDs.',
    ],
  },
  {
    title: '8. AI Assistant & Support Tickets',
    bullets: [
      'The AI Assistant provides general career and app guidance. Its answers may be incomplete or incorrect and must be independently verified before acting on them.',
      'AI responses are not a guarantee of selection, salary, interview success or company policy.',
      'To get human help, raise a support ticket from the AI Assistant section. Select the correct proper reason, write a clear subject and explain the issue with relevant job, company, HQ, account or screen details.',
      `You may also email ${SUPPORT_EMAIL}. Abusive, false, duplicate, spam or unclear tickets may be closed without action.`,
      'Support response times can vary. Tickets with a proper reason and complete details will be handled faster.',
    ],
  },
  {
    title: '9. Prohibited Use',
    bullets: [
      'Do not post fake jobs, false profiles, misleading salary claims, spam, abusive content or information belonging to another person.',
      'Do not harvest, scrape, sell or publish mobile numbers, email IDs, candidate profiles or recruiter contacts obtained through the app.',
      'Do not attempt to bypass ads, plan limits, masked contacts, account restrictions, Admin approval or other security/privacy controls.',
      'Do not harass users, request money for jobs, impersonate a company or use the app for any unlawful purpose.',
    ],
  },
  {
    title: '10. Account Deletion, Suspension & Removal',
    bullets: [
      'Recruiters can directly delete their Recruiter account from the app. Pending vacancy submissions linked to that mobile may be withdrawn; already approved LIVE vacancies may remain until Admin removes them.',
      'Job Seekers cannot directly delete their account. They must submit a deletion request with a proper reason, and Admin approval is required.',
      'Admin may warn, restrict, suspend or remove an account, profile, vacancy, ticket or application that violates these Terms or creates a safety/privacy risk.',
      'Deletion may not immediately remove records that must be retained for safety, dispute, support or legal reasons.',
    ],
  },
  {
    title: '11. Content, Ownership & Liability',
    bullets: [
      'The PharmaSales Jobs name, app design and original app content belong to PharmaSales Jobs / M Divakar Reddy unless otherwise stated.',
      'By submitting a profile, vacancy or support information, you permit PharmaSales Jobs to store and display it as needed to operate the services described in the Privacy Policy.',
      'The app is provided on an “as available” basis. We are not responsible for a Recruiter’s hiring decision, a candidate’s statements, interview outcomes, salary negotiations, joining, or losses caused by relying on inaccurate third-party information.',
      'Nothing in these Terms excludes liability that cannot legally be excluded under applicable Indian law.',
    ],
  },
  {
    title: '12. Changes, Governing Law & Support',
    bullets: [
      `These Terms & Privacy conditions are effective from ${LEGAL_POLICY_DATE} and may be updated inside the app when features or legal requirements change.`,
      'Continued use after an update means you accept the revised Terms. Material changes should be reviewed under Legal & Support in the app.',
      'These Terms are governed by the laws of India. Users should first contact support to resolve a concern informally and in good faith.',
      `Support: PharmaSales Jobs, managed by M Divakar Reddy • Email: ${SUPPORT_EMAIL} • Support tickets: AI Assistant → Raise Support Ticket.`,
    ],
  },
]
