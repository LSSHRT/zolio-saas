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

