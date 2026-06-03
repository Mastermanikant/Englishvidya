# Revamp English Vidya Homepage & Footer

This plan details the redesign of the "Connect with Us" section into an expandable accordion panel, optimizing the footer's social icons, adding animated credit links, and upgrading the homepage aesthetics from a 6/10 to a 9+/10.

## User Review Required

> [!IMPORTANT]
> The "Connect with Us" section (including the WhatsApp channel banner and 8 social buttons) will be integrated directly into the homepage's **Core Pillars** accordion as the 3rd card (**"03. Connect with Us"**). This will drastically clean up the initial homepage layout and keep it compact.

## Proposed Changes

### HTML Shell

#### [MODIFY] [index.html](file:///d:/English%20Vidya/website/index.html)
- Move the `social-connect-section` markup inside the `#morph-cards-container` as the third `.morph-card` element.
- Update the footer's bottom copyright section to include the "Developed and Designed by Master Manikant" credit line with the new `.manikant-link` class.

### CSS Styling

#### [MODIFY] [style.css](file:///d:/English%20Vidya/website/css/style.css)
- Add styling for `.manikant-link` with shifting gradient, hover glow, and expanding underline animations.
- Set `.footer-social-icons` to a neat `grid` with 4 columns (`repeat(4, 1fr)`) and a max-width constraint to present a clean 4x2 layout on all screens.
- Enhance homepage dashboard cards (Action Cards, Stats Cards) with subtle glassmorphic shadows, scaling hover interactions, and micro-animations to increase the premium feel.

## Verification Plan

### Manual Verification
- Deploy/load `index.html` in the browser.
- Verify that clicking the "03. Connect with Us" card smoothly expands to reveal the WhatsApp promotion and social icons.
- Check the footer to see the new Organized 4x2 social icon layout.
- Hover over the "Master Manikant" link to verify the animated gradient text glow and expanding underline.
- Confirm the homepage styling enhancements.
