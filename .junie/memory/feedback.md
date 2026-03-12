[2026-03-12 18:29] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "responsiveness regression",
    "EXPECTATION": "The site should adapt correctly to desktop layout even after activating the Pro version.",
    "NEW INSTRUCTION": "WHEN user reports layout not adapting THEN request page URL, viewport width, and screenshots"
}

[2026-03-12 18:31] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "responsiveness issue",
    "EXPECTATION": "The site should widen and adapt to desktop layout even after enabling Pro.",
    "NEW INSTRUCTION": "WHEN user reports layout not adapting THEN request page URL, viewport width, and screenshots"
}

[2026-03-12 18:41] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "decision autonomy",
    "EXPECTATION": "The user wants the assistant to choose and implement the most suitable option among proposed solutions.",
    "NEW INSTRUCTION": "WHEN user defers decision-making THEN choose and implement best option and explain briefly"
}

[2026-03-12 18:58] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "incomplete response",
    "EXPECTATION": "The assistant should finish the pending implementation and provide the remaining details without stopping midway.",
    "NEW INSTRUCTION": "WHEN user says continue or not finished THEN resume and complete implementation and confirm deployment"
}

[2026-03-12 19:07] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "broken feature",
    "EXPECTATION": "The 'Gérer l’abonnement' button should open the Stripe Customer Portal and let users manage their plan.",
    "NEW INSTRUCTION": "WHEN user reports manage subscription button not working THEN request page URL, click path, error text, and console/network screenshots"
}

[2026-03-12 19:15] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "missing information",
    "EXPECTATION": "The quote PDF should clearly include the sender company's details (name, address, contact).",
    "NEW INSTRUCTION": "WHEN generating a quote PDF THEN include company name, address, contacts, and logo in header"
}

[2026-03-12 19:20] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user agrees with implementing the proposed Customer Portal/manage subscription idea.",
    "NEW INSTRUCTION": "WHEN user expresses agreement with a proposed solution THEN proceed to implement and confirm deployment"
}

[2026-03-12 19:42] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "PDF layout overlap",
    "EXPECTATION": "The quote PDF should keep payment details out of the signature area and avoid any overlap between 'Bon pour accord' and the 'Date et signature...' text.",
    "NEW INSTRUCTION": "WHEN generating a quote PDF THEN place IBAN/BIC outside signature box and prevent overlap"
}

[2026-03-12 19:45] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "dark mode contrast",
    "EXPECTATION": "The Pro subscription button should remain readable and properly styled in dark theme.",
    "NEW INSTRUCTION": "WHEN user reports dark-theme button unreadable THEN request page URL, theme mode, and screenshot"
}

[2026-03-12 19:52] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "light theme contrast",
    "EXPECTATION": "The '+' icon for 'Nouveau Devis' should be clearly visible in light theme and small design details should be handled carefully.",
    "NEW INSTRUCTION": "WHEN styling icons or buttons THEN verify light-theme contrast and adjust colors for visibility"
}

[2026-03-12 19:58] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "dashboard layout",
    "EXPECTATION": "The revenue table should appear below the three feature buttons rather than above.",
    "NEW INSTRUCTION": "WHEN arranging dashboard sections THEN place revenue table below feature buttons"
}

[2026-03-12 20:44] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "PDF layout overlap",
    "EXPECTATION": "The 'Devis professionnel' title should sit below the Zolio logo (not on the photo), and the signature text must not overlap with the banking details (IBAN/BIC).",
    "NEW INSTRUCTION": "WHEN generating a quote PDF THEN place title below logo; separate signature box from banking details; prevent overlap"
}

[2026-03-12 20:59] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user agrees to proceed with the previously proposed implementation (e.g., Customer Portal/manage subscription).",
    "NEW INSTRUCTION": "WHEN user expresses agreement with a proposed solution THEN proceed to implement and confirm deployment"
}

[2026-03-12 22:04] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user agrees with proceeding to implement the previously proposed Customer Portal/manage subscription setup.",
    "NEW INSTRUCTION": "WHEN user expresses agreement with a proposed solution THEN proceed to implement and confirm deployment"
}

[2026-03-12 22:10] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user wants the assistant to proceed with implementing the Stripe Customer Portal/manage subscription flow and confirm deployment.",
    "NEW INSTRUCTION": "WHEN user expresses agreement with a proposed solution THEN proceed to implement and confirm deployment"
}

[2026-03-12 22:17] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "completion confirmation",
    "EXPECTATION": "The assistant should clearly confirm whether all requested features have been implemented and deployed.",
    "NEW INSTRUCTION": "WHEN user asks if everything is implemented THEN summarize completed changes and confirm deployment or list remaining steps"
}

[2026-03-12 22:17] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "incomplete response",
    "EXPECTATION": "The user wants the assistant to finish the previously interrupted explanation and provide the remaining steps.",
    "NEW INSTRUCTION": "WHEN user says \"fini\", \"continue\", or \"pas fini\" THEN resume and complete implementation and confirm deployment"
}

[2026-03-12 22:18] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "incomplete response",
    "EXPECTATION": "The user wants confirmation of what has been implemented and for the assistant to continue and finish if anything remains.",
    "NEW INSTRUCTION": "WHEN user asks if all implemented or says continue THEN summarize status, finish remaining work, and confirm deployment"
}

[2026-03-12 22:25] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user agrees to proceed with implementing the Stripe Customer Portal/manage subscription flow.",
    "NEW INSTRUCTION": "WHEN user expresses agreement with a proposed solution THEN proceed to implement and confirm deployment"
}

[2026-03-12 22:29] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "completion confirmation",
    "EXPECTATION": "The assistant should confirm if everything is implemented and continue to finish remaining work if not.",
    "NEW INSTRUCTION": "WHEN user asks if everything implemented or says continue THEN summarize status, complete remaining tasks, and confirm deployment"
}

[2026-03-12 22:33] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user agrees to proceed with implementing the Stripe Customer Portal to manage subscriptions (cancel/change) and expects deployment confirmation.",
    "NEW INSTRUCTION": "WHEN user expresses agreement with a proposed solution THEN proceed to implement and confirm deployment"
}

[2026-03-12 22:37] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "completion confirmation",
    "EXPECTATION": "The user wants confirmation of what has been implemented and for the assistant to continue and finish remaining work if not.",
    "NEW INSTRUCTION": "WHEN user asks if everything implemented or says continue THEN summarize status, complete remaining tasks, and confirm deployment"
}

[2026-03-12 22:41] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user wants to proceed with the proposed implementation (Stripe Customer Portal to manage subscriptions) and expects confirmation once deployed.",
    "NEW INSTRUCTION": "WHEN user expresses agreement with a proposed solution THEN proceed to implement and confirm deployment"
}

[2026-03-12 22:42] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "completion confirmation",
    "EXPECTATION": "The user wants confirmation that everything is implemented and for the assistant to continue and finish remaining work if not.",
    "NEW INSTRUCTION": "WHEN user asks if everything implemented or says continue THEN summarize status, finish remaining work, and confirm deployment"
}

[2026-03-12 22:44] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "completion confirmation",
    "EXPECTATION": "The assistant should confirm if everything is implemented and continue to finish remaining work if not.",
    "NEW INSTRUCTION": "WHEN user asks if everything implemented or says continue THEN summarize status, complete remaining tasks, and confirm deployment"
}

[2026-03-12 22:46] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user agrees with parts of the proposed solution (items 3 and 4) and wants them implemented.",
    "NEW INSTRUCTION": "WHEN user selects items from proposed list THEN implement chosen items and confirm deployment"
}

[2026-03-12 22:47] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "partial solution approval",
    "EXPECTATION": "The user wants items 3 and 4 from the proposed list to be implemented.",
    "NEW INSTRUCTION": "WHEN user selects items from proposed list THEN implement chosen items and confirm deployment"
}

[2026-03-12 22:47] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "partial solution approval",
    "EXPECTATION": "The user wants items 3 and 4 from the proposed list to be implemented.",
    "NEW INSTRUCTION": "WHEN user selects items from proposed list THEN implement chosen items and confirm deployment"
}

[2026-03-12 22:52] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user agrees to proceed with implementing the Stripe Customer Portal to allow managing the Pro subscription.",
    "NEW INSTRUCTION": "WHEN user expresses agreement with a proposed solution THEN proceed to implement and confirm deployment"
}

[2026-03-12 22:58] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user agrees to proceed with implementing the Stripe Customer Portal to manage subscriptions.",
    "NEW INSTRUCTION": "WHEN user expresses agreement with a proposed solution THEN proceed to implement and confirm deployment"
}

[2026-03-12 23:07] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "branding mismatch",
    "EXPECTATION": "The site colors should visibly match the logo palette after the update.",
    "NEW INSTRUCTION": "WHEN user reports no brand-color changes THEN request logo, hex colors, affected pages, and screenshots"
}

[2026-03-12 23:12] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "deployment status confirmation",
    "EXPECTATION": "The user wants confirmation whether the site has redeployed successfully on Vercel.",
    "NEW INSTRUCTION": "WHEN user asks about deployment status THEN summarize latest deployment and confirm ready or issues"
}

[2026-03-12 23:25] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "label clarification",
    "EXPECTATION": "The 'Sélectionner tout ($0)' label should not imply currency; it should indicate the number of selected items and allow bulk deletion after selection.",
    "NEW INSTRUCTION": "WHEN implementing bulk selection UI THEN display selected count without currency and show delete button when selection > 0"
}

[2026-03-12 23:38] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "design inconsistency",
    "EXPECTATION": "The Calpin page should match the polished design and components used on the other pages.",
    "NEW INSTRUCTION": "WHEN user reports a page lacks design THEN request page URL, reference page, and screenshots"
}

[2026-03-12 23:44] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "solution approval",
    "EXPECTATION": "The user agrees to proceed with implementing the Stripe Customer Portal to manage subscriptions (cancel/change) and expects confirmation once deployed.",
    "NEW INSTRUCTION": "WHEN user expresses agreement with a proposed solution THEN proceed to implement and confirm deployment"
}

[2026-03-12 23:49] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "completion confirmation",
    "EXPECTATION": "The assistant should confirm whether everything is implemented and continue to finish remaining work if not.",
    "NEW INSTRUCTION": "WHEN user asks if everything implemented or says continue THEN summarize status, complete remaining tasks, and confirm deployment"
}

[2026-03-13 00:02] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "incomplete response",
    "EXPECTATION": "The user wants the assistant to continue fixing the previously identified errors and finish the work.",
    "NEW INSTRUCTION": "WHEN user says continue THEN resume and complete implementation and confirm deployment"
}

[2026-03-13 00:03] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "incomplete response",
    "EXPECTATION": "The assistant should continue fixing the previously identified errors and finish the work.",
    "NEW INSTRUCTION": "WHEN user says continue THEN resume and complete implementation and confirm deployment"
}

[2026-03-13 00:06] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "incomplete response",
    "EXPECTATION": "The user wants the assistant to continue fixing the previously identified errors and finish the work.",
    "NEW INSTRUCTION": "WHEN user says continue THEN resume and complete implementation and confirm deployment"
}

