The Technical and Economic Blueprint of Modern Authentication: An Architectural Analysis of Identity and Access Management
Authentication Fundamentals
At its core, authentication is the cryptographic verification of an identity assertion. It answers the question of who a requesting entity is, while authorization evaluates that verified identity against access control policies to determine what resources the entity is permitted to access. Confusing these two distinct layers is a common architectural error; embedding granular permission scopes directly into stateless access tokens without runtime verification can lead to privilege escalation and authorization bypasses.
Modern web architectures handle authentication state using either stateful or stateless paradigms. Stateful sessions rely on a centralized or distributed data store (such as Redis or a relational database) where a unique session identifier is generated upon successful authentication, stored in a client-side cookie, and validated against the database on every subsequent request. Stateless authentication, typically executed via JSON Web Tokens (JWTs), shifts the burden of state validation from the server database to cryptography. The server issues a cryptographically signed payload containing user metadata (claims) and an expiration timestamp. The resource server merely verifies the cryptographic signature using a shared secret or a public key, eliminating database lookups at the expense of revocation complexity.
The transport layer introduces the distinction between cookies and tokens. Cookies are stateful or stateless containers managed natively by the browser, offering built-in security features such as the HttpOnly flag, which prevents access via JavaScript and mitigates Cross-Site Scripting (XSS) attacks. When paired with the Secure flag (requiring HTTPS transport) and the SameSite=Lax or SameSite=Strict directives, cookies provide robust protection against Cross-Site Request Forgery (CSRF).
Conversely, tokens (typically raw JWTs or opaque tokens) are often stored in browser storage mechanisms such as localStorage or sessionStorage and sent manually via HTTP authorization headers (e.g., Authorization: Bearer <token>). While token-based storage is highly compatible with mobile applications and cross-domain APIs, storing tokens in browser storage exposes them directly to extraction via XSS vulnerabilities.
To establish standardized identity delegation, modern web architectures employ OAuth 2.0 and OpenID Connect (OIDC). OAuth 2.0 is fundamentally an authorization framework designed to grant third-party applications limited access to HTTP resources via access tokens without exposing user credentials. OpenID Connect is an identity layer built directly on top of OAuth 2.0, introducing the ID token—a standardized JWT containing user profile claims—to transform a delegation framework into a federated authentication system.
+-------------------------------------------------------------+|                        OIDC (Identity)                      ||   - ID Token (JWT)                                          ||   - UserInfo Endpoint                                       |+-------------------------------------------------------------+|                       OAuth 2.0 (AuthZ)                     ||   - Access Token, Refresh Token                             ||   - Authorization Code Flow + PKCE                          |+-------------------------------------------------------------+
Modern authentication systems increasingly utilize passwordless mechanisms to mitigate credential-based vulnerabilities. Passkeys, built on the WebAuthn standard, utilize asymmetric public-key cryptography natively supported by user operating systems and hardware authenticators. The client device generates a public-private key pair, registering the public key with the authentication server while protecting the private key behind local biometric or PIN authorization.
Magic links and One-Time Passwords (OTPs) bypass passwords by delegating delivery to out-of-band communication channels like email or SMS. While highly user-friendly, they introduce significant vulnerabilities, including email interception, domain-level routing exploits, and SMS toll fraud.
Managing active device sessions and enforcing session revocation requires robust refresh token mechanics. While access tokens are designed with short lifespans (typically 15 minutes to an hour) to minimize the impact of token leakage, refresh tokens possess longer lifespans and are utilized to obtain new access tokens.
To prevent replay attacks, secure systems implement Refresh Token Rotation (RTR). Every time a refresh token is used, the authorization server invalidates it and issues a brand-new refresh token alongside the new access token. If a previously used refresh token is presented, the server detects the breach, invalidates the entire token family, and terminates all active sessions for that user.
For enterprise environments, authentication must integrate with centralized Identity Providers (IdPs) via SAML (Security Assertion Markup Language) and SCIM (System for Cross-domain Identity Management). SAML relies on an XML-based exchange of assertions to federate identity across distinct security domains, whereas SCIM standardizes the automated provisioning and de-provisioning of user accounts between enterprise directories (like Microsoft Entra ID) and downstream software applications.
Enterprise architectures combine these federated identities with Role-Based Access Control (RBAC), which maps permissions to static logical groups (roles), and Attribute-Based Access Control (ABAC), which dynamically evaluates runtime attributes (such as IP address, device compliance state, and geographic origin) to enforce fine-grained authorization.
The Landscape of Authentication Providers
Modern engineering teams choose between hosted Customer Identity and Access Management (CIAM) systems, self-hosted libraries, mobile-focused backends, and enterprise-grade federated systems.
Hosted Third-Party Providers
These providers operate as fully managed Software-as-a-Service (SaaS) infrastructures, taking complete ownership of security compliance, user databases, and multi-protocol federated routing.
Clerk: A developer-experience-first CIAM provider targeting modern React, Next.js, and serverless stacks. It features drop-in UI components and pre-built session management.
Auth0: The historical heavyweight of managed identity, acquired by Okta. It offers high customizability via serverless scripts (Actions) but suffers from post-merger pricing hikes.
Firebase Auth: Google's low-cost authentication backend, closely integrated with the Firebase and Google Cloud ecosystems.
Supabase Auth: An open-source, Postgres-centric CIAM system powered by GoTrue, built natively into the Supabase BaaS platform.
Kinde: A modern competitor to Clerk, designed for B2C and B2B scale with a generous free tier and built-in feature-flagging capabilities.
Stytch: A developer-focused provider prioritizing passwordless architecture, passkeys, and direct API/SDK integration.
WorkOS: A dedicated enterprise-readiness engine designed to bridge startup applications to enterprise SSO (SAML), SCIM directory sync, and audit logs.
Cognito (AWS): Amazon's high-scale, low-cost native identity store, notorious for its complex configuration and developer experience friction.
FusionAuth: A deployable or managed single-tenant identity engine designed to balance SaaS ease-of-use with database isolation.
Magic.link: A specialized CIAM engine focusing exclusively on secure magic links, passkeys, and web3-compatible wallet authentication.
Okta Customer Identity Cloud: The enterprise-focused parent tier of Auth0, optimized for global identity consolidation.
Descope: A visual workflow-based CIAM engine that allows developers to design authentication flows via drag-and-drop flowcharts.
PropelAuth: A B2B-centric CIAM provider specializing in organizational management, member self-service dashboards, and multi-tenant SSO.
Self-Hosted and Library-Based Frameworks
These frameworks provide complete data ownership and eliminate monthly active user subscription costs by placing the execution burden on the application's native compute infrastructure.
Auth.js (formerly NextAuth.js): The standard open-source auth framework for the Next.js ecosystem, which supports database adapters and stateless session signatures but faces operational challenges in edge-runtime environments.
Better Auth: A modern, framework-agnostic, TypeScript-first authentication library designed to replace legacy frameworks. It features an extensible plugin system and native support for modern ORMs like Drizzle.
Lucia Auth: A highly regarded database-session library that is officially deprecated as of March 2025.
SuperTokens: An open-source, architecture-first auth engine offering pre-packaged session management, automatic token rotation, and robust security defaults.
Ory (Kratos, Hydra, Oathkeeper): A highly secure, cloud-native suite of identity services built in Go, implementing advanced hardened standards (OIDC, OAuth 2.0, Zero Trust).
Keycloak: The enterprise open-source standard. A mature, Java-based identity engine offering robust federation, user management, and SAML/OIDC compliance.
Custom JWT Authentication: Hand-crafted authentication mechanisms utilizing frameworks like Express or Fastify paired with core cryptographic packages.
Passport.js: The legacy Node.js authentication middleware utilizing modular strategies for diverse social and local credential verification.
Mobile-Focused Solutions
Optimized for state persistence across network transitions and local device biometric storage.
Firebase SDK: Offers offline-first state persistence and native integration with Apple and Google biometrics.
Appwrite Auth: An open-source self-hosted alternative to Firebase, delivering simplified mobile SDKs and native session synchronization.
AWS Amplify Auth: A high-level frontend wrapper around Cognito, combining mobile biometrics with cloud-native AWS resources.
Deep-Dive Architectural Profiles of Major Authentication Providers
Selecting an authentication provider or library requires evaluating its underlying architecture, runtime behaviors, and economic scale limitations. The following deep dives analyze the primary modern authentication engines across these critical areas.
Managed SaaS CIAM Engines
+------------------------------------------------------------+|                    Hosted SaaS Providers                   |+------------------------------------------------------------+|  CLERK         - High DX, Rapid MVP, Steep Scale Costs     ||  AUTH0         - Enterprise Powerhouse, Complex Actions,   ||                  High Vendor Lock-in                       ||  SUPABASE/     - Database-Coupled, GoTrue-Powered,         ||  FIREBASE      - Cost-Effective but Ecosystem Bound        ||  COGNITO       - Raw Scale, High Configuration Friction,    ||                  No Hash Export Capability                 |+------------------------------------------------------------+
Clerk
Clerk targets pre-revenue startups, solo developers, and teams building on React, Next.js, and modern serverless stacks where speed-to-market is the primary objective. It should never be used for high-volume B2C products with thin margins, applications with strict geographic data residency requirements, or complex multi-tenant enterprise networks.
Architectural Mechanics and Integration Profiles
Clerk operates as an opinionated, component-driven identity platform. It intercepts client-side routing via custom React Context providers and injects pre-styled UI components (<SignIn />, <UserProfile />) directly into the DOM. This abstracts away the complexity of managing authentication flows.
Cloudflare and Vercel Compatibility: Clerk is highly optimized for Vercel and serverless architectures. It manages session verification at the edge by validating JWT signatures in middleware, bypassing database requests. It is fully compatible with Cloudflare Workers and Pages, utilizing Web Crypto APIs for token verification.
Edge-Runtime and SSR: Excellent. Next.js App Router and server component compatibility are central to its design. Client sessions are verified server-side inside Next.js middleware before rendering routes.
Mobile Compatibility: Moderate. While SDKs exist for React Native and Expo, the core developer experience remains heavily skewed towards React-based web applications.
AI IDE / Vibe Coding Friendly: Exceptional. Because Clerk abstracts the complex mechanics of auth into a few pre-packaged UI components and a simple middleware hook, AI code generators (e.g., Cursor, v0) can easily integrate secure authentication without introducing cryptographic flaws or complex database schemas.
Security, Vendor Lock-in, and Compliance
Clerk maintains a solid security maturity level, implementing robust password hashing, automatic session token rotation, and managed MFA/passkey support natively. However, the vendor lock-in risk is extremely high. User profiles, metadata, and active sessions are hosted entirely within Clerk’s infrastructure.
Exporting raw user data is possible, but migrating active sessions to another provider is extremely difficult. This forces all migrated users to re-authenticate. The platform is GDPR compliant, but because customer databases are hosted on managed multi-tenant clusters, teams requiring strict, isolated data residency or HIPAA compliance face significant configuration hurdles.
Financial Realities and Scale Limitations
While the developer experience is outstanding, the pricing model is a significant scaling bottleneck. Clerk offers a generous free tier of up to 10,000 Monthly Active Users (MAUs). However, exceeding this limit triggers steep pricing steps.
Beyond the free tier, pricing rises to $0.02 per additional MAU, resulting in a cost of $300/month for 25,000 MAUs, escalating to $825/month for 50,000 MAUs, and reaching $1,800/month for 100,000 MAUs. For a high-scale B2C app reaching 500,000 MAUs, the cost escalates to approximately $9,800/month.
Additionally, features such as custom domain branding are vulnerable to unexpected price hikes, with historical updates showing domain-auth add-ons increasing 5x from $25/month to $125/month.
Core Technical Flaws and Failure Modes
Client-Side Hydration Lag: In React-based apps, the UI components can suffer from layout shifts during initial hydration as the Clerk JS bundle checks the active session state against Clerk's API endpoints.
Multi-tenant Edge Outages: If Clerk's central API experiences a regional or global outage, all client applications lose the ability to authenticate users or decode sessions.
Strict Dependency Lock-In: Major upgrades can introduce breaking changes, forcing teams to perform large-scale refactoring to maintain basic authentication routing.
Auth0 (Okta Customer Identity Cloud)
Auth0 is optimized for mid-market to enterprise-grade B2B SaaS platforms with budgets that accommodate premium usage tiers and require advanced enterprise federation. It should never be used by bootstrapped B2C startups, high-volume consumer applications, or teams seeking simple, low-overhead deployments.
Architectural Mechanics and Integration Profiles
Auth0 operates on a federated single-sign-on (SSO) model. It utilizes a central, hosted login portal (Universal Login) that redirects users from the client application to Auth0's domains to perform authentication before returning them with authorized OIDC tokens. Customization is achieved through serverless Javascript sandboxes known as Auth0 Actions, which execute during runtime token issuance.
Cloudflare and Vercel Compatibility: Fully compatible via standard OIDC SDKs. However, because Auth0 relies on stateful round-trips to its endpoints, edge executions must account for network latency overhead.
Edge-Runtime and SSR: Fully supported via SDKs like @auth0/nextjs-auth0, which support edge execution. However, handling session state requires secure cookie configurations that can be difficult to manage across different subdomains.
Mobile and AI IDE Compatibility: High. Extensive native iOS, Android, and Flutter SDKs make it highly viable for cross-platform deployments. However, its complex administrative console and the sheer surface area of its configuration schemas mean AI IDEs often struggle to configure its integrations correctly, occasionally generating mismatched client ID scopes or broken custom Actions.
Security, Vendor Lock-in, and Compliance
Auth0 offers an enterprise-grade security posture. It is SOC 2 Type II, ISO 27001, and HIPAA compliant, providing robust credential-stuffing defense, adaptive MFA, and comprehensive security logging. However, vendor lock-in is a notorious concern.
Exporting user databases is highly complex. Password hashes are exported in formats that are often incompatible with other standard systems, which can complicate migrations and force users to undergo password reset flows. Additionally, custom rules and database scripts are heavily tied to Auth0’s proprietary sandbox runtime.
Financial Realities and Scale Limitations
Auth0's pricing model is a common point of criticism within the developer community. The free tier is capped at 7,000 MAUs and allows only 2 social connections, enforcing mandatory Auth0 branding.
Once these limits are exceeded, pricing scales steeply. Mid-market tiers are expensive, and transitioning from the self-service plans to enterprise-negotiated contracts often yields pricing increases of 300% or more.
Furthermore, advanced features such as Machine-to-Machine (M2M) tokens, enterprise SAML connections, or custom domains are priced on a per-unit basis. This can lead to unexpected cost escalations for growing B2B products.
Core Technical Flaws and Failure Modes
Layout and Branding Constraints: The hosted Universal Login page can be difficult to style, creating UX friction when transitioning users from custom client-side web apps to Auth0-hosted interfaces.
Actions Execution Failures: Custom Actions scripts run in isolated Node.js sandboxes. If these external sandboxes experience latency or dependency failures, the entire authentication pipeline stalls, locking out all users.
User Record Duplication: If a user registers with the same email across different social and password connections, Auth0 defaults to creating distinct user profiles. This requires engineering teams to write and maintain complex account-merging middleware.
Supabase Auth
Supabase Auth is optimized for startups and engineering teams looking for a cost-effective, open-source backend-as-a-service (BaaS) that is built directly on top of PostgreSQL. It should be avoided by teams requiring a highly decoupled identity platform, enterprises bound to non-Postgres data architectures, or systems needing multi-region database operations.
Architectural Mechanics and Integration Profiles
Supabase Auth is powered by GoTrue—an open-source, Go-based API microservice that handles user registration, session state, and JWT generation. GoTrue maps user identities directly to a dedicated auth schema within the application's PostgreSQL database.
This allows developers to write Postgres Row-Level Security (RLS) policies that read incoming JWT claims to authorize database queries on a per-row basis.
Cloudflare and Vercel Compatibility: Fully compatible. The client SDK is lightweight and runs seamlessly in serverless, edge, and worker runtimes.
Edge-Runtime and SSR: Highly compatible. Next.js and SvelteKit integrations provide middleware-level session extraction and verification out of the box.
Mobile and AI IDE Compatibility: Excellent. Mobile SDKs are well-maintained. AI IDE workflows are highly effective with Supabase Auth due to its standardized SQL-based authorization model, allowing AIs to easily write security-hardened RLS rules.
Security, Vendor Lock-in, and Compliance
The security model is highly robust, relying on standard PostgreSQL access controls. Because data is stored in a standard PostgreSQL database, vendor lock-in is exceptionally low.
If a team decides to leave the managed Supabase Platform, they can perform a standard SQL dump (pg_dump) to export the complete auth schema—including bcrypt-hashed passwords and metadata—and run their own GoTrue instance on independent virtual machines. SOC 2 compliance is available on Supabase's paid hosted plans.
Financial Realities and Scale Limitations
Supabase offers highly predictable and affordable pricing compared to B2C-focused competitors. The managed platform includes 10,000 MAUs on its free tier, with the flat-rate $25/month Pro tier accommodating up to 100,000 MAUs before charging nominal usage increments.
Because the backend scales with the underlying PostgreSQL database compute, there are no artificial pricing gates for key identity features like custom domains or enterprise integrations.
Core Technical Flaws and Failure Modes
Postgres Compute Bottlenecks: GoTrue executes queries directly against the application database. High volumes of authentication requests, registration storms, or password-reset cycles can consume the database's CPU, triggering alerts and causing performance degradation across the entire application.
Connection Pool Exhaustion: In serverless environments, GoTrue and database connections can scale rapidly. Without proper connection pooling (e.g., via Supavisor), the database can run out of available sockets, leading to dropped connection requests and authentication failures.
RLS Policy Execution Latency: If database tables lack proper indexes, evaluating complex nested RLS policies on large tables can trigger extensive sequential scans. This can cause high CPU utilization, query timeouts, and cascading server failures.
Amazon Cognito
Cognito is highly suitable for teams fully integrated into the AWS ecosystem, utilizing services like AppSync, API Gateway, or AWS Lambda, and needing to scale to millions of users at the lowest possible cost. It should never be used by teams that prioritize developer experience, require rapid prototyping, or need a portable authentication provider.
Architectural Mechanics and Integration Profiles
Cognito divides its services into User Pools (which act as the identity directory for user registration, authentication, and token issuance) and Identity Pools (which authorize users to obtain temporary AWS IAM credentials to access raw AWS resources directly, such as S3 buckets or DynamoDB tables).
Cloudflare and Vercel Compatibility: Poor. While Cognito can be accessed via standard HTTP requests and JWT validation, the official AWS SDKs are heavy and often run into execution problems in non-Node serverless edge runtimes.
Edge-Runtime and SSR: Highly complex. Configuring Cognito with modern server-side-rendered frameworks requires manual token extraction, cookie storage middleware, and token validation implementations.
Mobile and AI IDE Compatibility: Moderate to poor. The developer experience is heavily tied to AWS Amplify. AWS Amplify abstracts the complex configurations but introduces its own rigid CLI architecture. AI assistants frequently struggle to generate functional Cognito configurations due to outdated documentation and obtuse CloudFormation schemas.
Security, Vendor Lock-in, and Compliance
Cognito meets high-level enterprise compliance standards, including HIPAA, PCI DSS, SOC 1/2/3, and ISO 27001. However, vendor lock-in is extremely high.
AWS Cognito does not allow developers to export raw password hashes under any circumstances. If a startup chooses to migrate away from Cognito, they are forced to rebuild their user database and require every user to reset their password.
Financial Realities and Scale Limitations
Cognito’s primary advantage is its low pricing. It offers a free tier of 10,000 MAUs, and subsequent tiers cost $0.0055 per MAU, which is a fraction of the cost of premium hosted competitors.
However, advanced security features (such as adaptive threat detection and compromised credential monitoring) require upgrading to the Cognito Plus tier, which incurs an additional flat charge of $0.02 per MAU with no free tier allocation.
Furthermore, integrating enterprise SAML/OIDC federation adds a charge of $0.015 per MAU for all users above a low free limit.
Core Technical Flaws and Failure Modes
The Simple Email Service (SES) Trap: Cognito defaults to a low-volume sandbox email service for transactional emails, which is unsuitable for production. Transitioning to production requires manual setup of AWS SES. If AWS rejects the account's SES production access request—which is common for new or unverified AWS accounts—the application is left unable to register users or process password resets.
Immutable Database Schemas: Once user attributes (schemas) are configured in a Cognito User Pool, they cannot be modified or deleted. Changing the user schema requires deleting and recreating the entire user pool, which deletes all existing user data.
NAT Gateway Cost Overhead: Running AWS Lambda triggers to customize Cognito flows (such as post-confirmation data sync) requires placing the lambdas in a VPC. This necessitates provisioning NAT Gateways, which can add significant monthly infrastructure costs even for low-traffic applications.
Email Change Security Flaw: Historically, Cognito suffered from a known bug where a user could change their account email to an unverified address without immediate validation, leaving accounts vulnerable to domain hijacking until manually patched.
Self-Hosted Library and Framework-Based Systems
+------------------------------------------------------------+|             Self-Hosted & Library-Based Systems            |+------------------------------------------------------------+|  BETTER AUTH   - Framework Agnostic, Extensible Plugins,   ||                  Excellent Edge & ORM Compatibility        ||  AUTH.JS       - Next.js Native, Session Cache,            ||                  Requires Split-Config Hacks at the Edge   ||  SUPERTOKENS   - Hardened Session Rotations, Secure        ||                  Defaults, Managed & Self-Hosted Modes     ||  KEYCLOAK      - Java/JVM Heavyweight, Complete Enterprise ||                  Compliance, Complex Operations & Maintenance|+------------------------------------------------------------+
Better Auth
Better Auth is suited for modern TypeScript engineering teams that prioritize developer control, type safety, low operational overhead, and full database ownership across serverless and edge environments. It is not recommended for legacy non-Node codebases, teams lacking database administration capabilities, or developers seeking a fully managed SaaS experience.
Architectural Mechanics and Integration Profiles
Better Auth is a modern, framework-agnostic, open-source authentication library built from the ground up for TypeScript environments. It features an extensible plugin architecture, allowing developers to add features like 2FA, passkeys, and organization management through modular configurations rather than a monolithic framework.
It integrates with modern ORMs like Drizzle and Prisma, executing database operations directly inside the application's runtime compute.
Cloudflare and Vercel Compatibility: Exceptional. It is natively compatible with Cloudflare Workers, Pages, and the Vercel Edge Runtime. It relies on standard Web Crypto APIs, avoiding Node.js-specific dependencies.
Edge-Runtime and SSR: First-class. It features native adapters for Next.js App Router, Astro, SvelteKit, Remix, and Nuxt, enabling seamless session extraction and validation across both SSR and edge runtimes.
Mobile and AI IDE Compatibility: Highly compatible. Because Better Auth features strict, end-to-end TypeScript inference for user schemas and session payloads, AI IDEs can easily read the type definitions to generate type-safe routes, database queries, and client-side components.
Security, Vendor Lock-in, and Compliance
The security architecture is robust. It supports modern WebAuthn passkeys, passwordless flows, and secure cookie handling natively.
Because Better Auth is MIT-licensed and self-hosted, the vendor lock-in risk is zero. The application developer retains complete ownership of the database schema, user records, and session tables, facilitating compliance with regulations like GDPR and HIPAA.
Financial Realities and Scale Limitations
Better Auth is effectively free to operate, with no monthly active user subscription costs regardless of scale.
The only operational costs are the compute resources of the hosting environment and database storage. This makes it highly cost-effective for B2C startups scaling to hundreds of thousands of users.
Core Technical Flaws and Failure Modes
Database Schema Drift: Changes to Better Auth’s internal schemas (such as adding verification tokens or session metadata) require database migrations. If migration steps are misconfigured, the application can experience database crashes during authentication queries.
Session State Synchronization: Unlike hosted CIAM providers that manage session caching globally, Better Auth reads session state directly from the database. High-concurrency environments require implementing caching layers (such as Redis) to prevent authentication queries from overwhelming the primary database.
Auth.js (formerly NextAuth.js)
Auth.js is optimized for teams building applications within the Next.js ecosystem that require a simple, open-source authentication solution with standard social login integrations. It is not recommended for non-Next.js applications, high-performance edge-only architectures, or applications needing complex multi-tenant B2B features.
Architectural Mechanics and Integration Profiles
Auth.js operates as an open-source middleware library designed to handle OAuth, passwordless, and credential-based authentication. It provides built-in database adapters to automatically manage user accounts and session data inside various databases.
Cloudflare and Vercel Compatibility: Moderate. Deploying Auth.js in edge runtimes (like Cloudflare Workers) can introduce compatibility challenges due to database client requirements.
Edge-Runtime and SSR: Complex edge integration. In older Next.js architectures, middleware is forced to run in the Vercel Edge Runtime, which lacks support for standard TCP-based Node database adapters. To circumvent this, developers must implement a Split Config architecture. This separates the core database configuration from the lightweight, database-free session check executed in edge middleware.
Mobile and AI IDE Compatibility: Moderate. While mobile integration is possible, it is not a primary design focus of the framework. AI IDEs can easily generate standard Auth.js configurations, but they frequently struggle with the complex setups required for split configurations or custom database adapter hooks.
Security, Vendor Lock-in, and Compliance
Auth.js features strong security defaults, including automatic CSRF protection, secure cookie management, and state verification during OAuth flows.
Because the library is open-source and self-hosted, vendor lock-in is minimal. Developers retain full control over their databases, simplifying compliance setups.
Financial Realities and Scale Limitations
Operating Auth.js is highly cost-effective since it is open-source and lacks licensing or MAU-based fees.
However, scaling to millions of users requires careful resource management. Because Auth.js executes database queries for session validation on every authenticated request, a high volume of active sessions can strain database connection pools. This necessitates implementing caching layers or transitioning to JWT-based stateless sessions.
Core Technical Flaws and Failure Modes
Database Query Overhead: Every session evaluation (auth()) can trigger a round-trip database query to verify session validity, which can lead to database performance bottlenecks in high-concurrency environments.
Tight Next.js Coupling: Although rebranded as Auth.js to support other frameworks, the core library remains heavily tied to Next.js release cycles, making it vulnerable to breaking changes during major Next.js upgrades.
Keycloak
Keycloak is designed for enterprise systems, government applications, and large organizations that require a mature, highly compliant, open-source Identity and Access Management (IAM) platform capable of advanced federation and SSO. It should never be used by lightweight startups, solo developers, or teams seeking simple, low-maintenance, serverless deployments.
Architectural Mechanics and Integration Profiles
Keycloak is a Java-based, standalone IAM engine built on the WildFly application server (or Quarkus in modern releases). It runs as an independent service, exposing standard OIDC and SAML 2.0 endpoints to client applications.
Cloudflare and Vercel Compatibility: Fully compatible via standard OIDC protocols. Client-side applications in Vercel or Cloudflare communicate with Keycloak over HTTPS, making it runtime-agnostic.
Edge-Runtime and SSR: Keycloak's core cannot run inside serverless edge runtimes due to its Java-based JVM architecture. However, edge-rendered client applications can easily decode and verify Keycloak-signed JWTs locally at the edge.
Mobile and AI IDE Compatibility: High. It features extensive, battle-tested SDKs for native iOS, Android, and cross-platform frameworks. However, the administrative console is complex, and AI IDEs often struggle with raw Keycloak setups due to the sheer volume of advanced XML/JSON configuration schemas.
Security, Vendor Lock-in, and Compliance
Keycloak offers enterprise-grade security. It natively supports advanced authentication protocols (such as Kerberos, SAML 2.0, and OIDC), granular RBAC/ABAC authorization, and built-in user federation with LDAP and Active Directory.
Because it is open-source, vendor lock-in is extremely low. However, its complex internal schema and configurations require deep expertise to migrate. Keycloak is highly compliant, facilitating adherence to SOC 2, HIPAA, and GDPR standards.
Financial Realities and Scale Limitations
Keycloak is open-source and has zero licensing or MAU fees.
However, the total cost of ownership (TCO) is driven by operational and hosting expenses. Keycloak is resource-intensive, requiring dedicated VM instances, load balancers, and highly available database clusters to operate reliably at scale.
Core Technical Flaws and Failure Modes
JVM Overhead and Cold Starts: Keycloak's Java runtime demands significant memory and CPU overhead. It cannot be deployed on serverless container runtimes with scale-to-zero configurations due to long container startup delays.
Highly Complex Customization: Extending Keycloak's core capabilities (such as building custom authentication flows or database adapters) requires writing custom Java SPI (Service Provider Interface) plugins. This can be complex and demands specialized backend engineering expertise.
Community Sentiment vs. Verified Technical Reality
Understanding the real-world operational challenges of identity systems requires analyzing the gap between developer discussions and actual production performance.
Clerk
Community Sentiment
Clerk is highly praised across forums like Reddit and Hacker News for its rapid setup times, polished drop-in UI components, and intuitive Developer Experience (DX).
However, it is criticized for its steep pricing model once applications scale beyond the free tier, with developers warning of "pricing cliffs" and "vendor trap" mechanics that make post-launch migrations costly and complex.
Verified Technical Reality
Clerk’s developer-experience benefits are highly effective for rapid prototyping and B2B SaaS applications, where average revenue per user (ARPU) easily covers the MAU subscription costs.
However, for high-traffic B2C applications with thin margins, the MAU-based pricing model can escalate quickly.
Additionally, because Clerk hosts both user profiles and sessions on its infrastructure, migrating users to an alternative provider without forcing a password reset requires coordinate planning, though it is technically viable through Clerk's secure user export APIs.
Auth0
Community Sentiment
Auth0 is widely criticized by developers for its pricing structure and the perceived stagnation of its product following its acquisition by Okta.
Engineering forums frequently share accounts of substantial price increases (sometimes exceeding 15x or 300%) for legacy B2C plans, slow customer support response times, and an increasingly complex admin interface.
Verified Technical Reality
While Auth0 is a robust, enterprise-grade identity platform, its post-acquisition operational shift has introduced challenges for smaller developers, including slower support response times on lower tiers.
The platform remains highly secure, but its technical complexity—particularly around custom JavaScript Actions and token routing—requires dedicated engineering resources.
The difficulty of database migration is a real constraint: because Auth0 utilizes custom password hashing formats, migrating user databases to another platform often requires users to reset their passwords.
AWS Cognito
Community Sentiment
The consensus across developer communities is highly critical of AWS Cognito, with many describing it as an abandoned or unnecessarily complex product with poor documentation and a frustrating administrative experience.
Developers frequently warn about its immutable user schemas, the requirement of AWS SES for basic production email delivery, and the lack of a straightforward backup utility.
Verified Technical Reality
Cognito is a highly scalable and cost-effective identity solution, especially for teams building within the AWS ecosystem.
However, the community's technical criticisms are well-founded:
User schemas are immutable once created; modifying them requires a complete rebuild of the pool.
Raw password hashes cannot be exported, creating significant migration barriers.
Integrating custom authentication logic requires deploying supplementary Lambda functions, which can introduce network latency and cost overhead (such as NAT Gateway requirements).
Supabase Auth
Community Sentiment
Supabase Auth is highly regarded in the developer community for its ease of use, seamless integration with PostgreSQL, and low pricing.
However, some developers report unexpected CPU spikes on their database instances, which they attribute to authentication workflows and GoTrue execution.
Verified Technical Reality
Supabase Auth is highly performant, but because its authentication engine (GoTrue) writes directly to the application's primary database, intense login traffic or password verification storms can consume significant database compute resources.
This is particularly true on the shared CPU tiers of the free plan.
To prevent high CPU usage at scale, developers must ensure proper indexing of user tables, optimize database connections, and occasionally scale compute resources.
Startup Scaling Analysis: Identity Roadblocks by Stage
As a startup grows, its authentication requirements shift from speed of implementation to cost management, infrastructure stability, and regulatory compliance.
       0 -> 1k Users       |     10k -> 50k Users       |     100k -> 500k+ Users+--------------------------+----------------------------+-----------------------------+| * Priority: Fast MVP     | * Challenge: Pricing Cliff | * Challenge: Infrastructure || * Zero cost setups       | * SMS OTP Toll Fraud       | * Session database bottlenecks|| * Simple social logins   | * Migration planning       | * Compliance: SOC2, GDPR    |+--------------------------+----------------------------+-----------------------------+
Stage 1: The Incubation Phase (0 to 1,000 Users)
At this stage, the primary priorities are developer velocity and minimal capital expenditure. High-level hosted providers like Clerk or Kinde are highly effective here, as their free plans cover up to 10,000 MAUs, allowing startups to launch their MVPs quickly without upfront costs.
Security at this stage focuses on basic protections, such as enforcing secure HTTPS cookies, implementing standard social logins, and ensuring secure password reset flows.
Stage 2: The Traction Phase (1,000 to 10,000 Users)
As user sign-ups grow, startups must monitor their resource usage and prepare for potential scaling thresholds. At this volume, security threats like automated registration bots begin to emerge, requiring the implementation of basic rate limiting and CAPTCHA protections.
Additionally, startups must transition from default development keys for social logins (e.g., Google or GitHub) to verified developer credentials to ensure consistent branding and reliable redirect URIs.
Stage 3: The Scale Phase (10,000 to 50,000 Users)
This stage represents a critical transition point where pricing and infrastructure constraints often become apparent.
The Hosted Pricing Cliff: Exceeding the free tiers of premium hosted services can trigger steep price increases, with monthly bills sometimes escalating from zero to hundreds of dollars. This can force bootstrapped or low-margin startups to plan complex migrations.
SMS OTP Toll Fraud: Utilizing SMS-based OTPs at this volume exposes startups to SMS pumping attacks, where malicious actors exploit registration forms to send bulk SMS messages. This can result in significant financial charges if not restricted with rate limits and geolocation IP blocks.
Database Schema Constraints: For self-hosted architectures, database schema design becomes critical. If user schemas or indexing configurations are sub-optimal, authentication queries can trigger sequential scans, slowing down database performance.
Stage 4: The Acceleration Phase (50,000 to 100,000 Users)
At this scale, operational complexity and infrastructure engineering become central to maintaining system performance.
Session Management Overhead: For databases running self-hosted authentication, session verification queries can begin to saturate database connection pools. This requires implementing caching layers, connection pooling, or transitioning to stateless JWT validation.
Email Deliverability Challenges: Transactional emails (such as verification links and password resets) can face deliverability issues. Startups must move away from default email configurations to dedicated, warm IP addresses on transactional email services (e.g., Postmark or SendGrid) while configuring SPF, DKIM, and DMARC records to ensure inbox placement.
Compliance Requirements: B2B startups at this scale often face enterprise requirements, necessitating SOC 2 Type II audits, strict GDPR compliance, and the ability to integrate with enterprise Identity Providers via SAML.
Stage 5: The Enterprise Phase (100,000 to 500,000 Users)
System reliability and regulatory compliance are paramount at this stage, with startups requiring high-availability architectures and robust data isolation.
Enterprise SSO Demands: Enterprise customers will require custom Single Sign-On (SSO) configurations and automated user provisioning via SCIM.
Bot and DDoS Attacks: Automated credential-stuffing attacks and DDoS attempts on login endpoints become regular occurrences, requiring dedicated web application firewalls (WAFs), advanced rate limiting, and automated threat detection.
Data Isolation and Residency: Compliance regulations (such as HIPAA or GDPR) may require isolating customer data or ensuring regional residency. This can necessitate migrating from shared multi-tenant SaaS environments to isolated single-tenant deployments or self-hosted architectures.
Stage 6: The Hyper-Scale Phase (500,000 to 1,000,000+ Users)
At this volume, authentication operates as a critical infrastructure utility, demanding high-availability engineering and minimal latency.
Multi-Region Synchronization: Global applications require active-active database replication and multi-region session validation to ensure low-latency authentication near the user's location.
High-Volume Session Revocation: Managing session revocation across distributed systems requires highly optimized cache invalidation strategies, such as backchannel logout cascades and synchronized token denylists.
Significant Infrastructure Costs: Running hosted authentication at this volume can incur substantial monthly subscription costs. High-volume platforms often choose to migrate to custom, self-hosted architectures (such as Better Auth or Keycloak) to reduce ongoing licensing expenses.
Modern Stack and Edge-Runtime Compatibility
Modern web development increasingly utilizes serverless edge computing (e.g., Cloudflare Workers, Vercel Edge Runtime) to deliver low-latency experiences near the user. However, running authentication in these resource-constrained environments introduces unique architectural challenges.
Edge Runtime Execution Barriers
Serverless edge runtimes do not use full Node.js engines; instead, they operate on lightweight, V8-based runtimes. This introduces several technical constraints:
Missing Node.js APIs: Edge runtimes lack native support for several core Node.js modules (such as net, tls, and fs).
TCP Socket Restrictions: Standard database drivers require raw TCP sockets to communicate with databases. Since edge runtimes often restrict raw TCP access, developers must utilize HTTP-based database drivers or connection-pooling proxies (such as Prisma Accelerate).
Cryptographic Library Limits: Legacy cryptographic libraries (like bcrypt) often rely on C++ bindings that cannot execute in edge runtimes. Edge-native systems must utilize pure-JavaScript implementations or the Web Crypto API.
Split Configuration Architecture
To bypass these edge-runtime database constraints, developers utilizing libraries like Auth.js must implement a split-configuration architecture.
Under this model, the lightweight edge middleware only performs cryptographic JWT signature validation using public keys, avoiding direct database connections. The primary database operations (such as registration and user-profile updates) are routed to standard, non-edge server environments (like Node.js or serverless functions) that support standard database connections.
+------------------------------------------------------------+|                       Edge Runtime         [span_46](start_span)[span_46](end_span)                ||  - Cloudflare Workers / Vercel Edge                        ||  - Stateless Cryptographic JWT Validation                  ||  - Zero Database Queries                                   |+--------[span_47](start_span)[span_47](end_span)----------------------------------------------------+                               |                        Network Boundary                               |+------------------------------------------------------------+|                     Standard Serverless                    ||  - Full Node.js Compute (AWS Lambda, etc.)                 ||  - Database Adapter Connections (Postgres, Drizzle, etc.)   ||  - Session Creation & Write Operations                     |+------------------------------------------------------------+
Stack Compatibility Matrix
Provider / Library
Cloudflare Workers & Pages
Next.js App Router
Astro & Remix
Offline-First & PWAs
Primary Runtime Requirements
Clerk
Fully Compatible
Fully Compatible
Fully Compatible
Limited
Edge / Web Crypto
Auth0
Compatible (via API)
Fully Compatible
Fully Compatible
Limited
Node.js / Browser
Supabase Auth
Fully Compatible
Fully Compatible
Fully Compatible
Highly Compatible
Edge / Web Crypto
Better Auth
Fully Compatible
Fully Compatible
Fully Compatible
Highly Compatible
Edge / Web Crypto
Auth.js
Requires Split Config
Fully Compatible
Fully Compatible
Limited
Node.js / Split Config
SuperTokens
Fully Compatible
Fully Compatible
Fully Compatible
Highly Compatible
Node.js / Managed API
Keycloak
Compatible (via OIDC)
Fully Compatible
Fully Compatible
Highly Compatible
JVM (Java Runtime)
Future-Proofing: Decoupling and Database Design
Startups often regret their choice of authentication provider due to early-stage vendor lock-in. To avoid these traps, developers should adopt architectural patterns that decouple the identity layer from core application logic.
The Auth-Facade Architectural Pattern
Engineering teams should avoid importing authentication-specific SDKs directly into their core business logic. Instead, they should implement an abstraction layer (an Auth-Facade) that defines a standard interface for identity operations.
// Define a generic, provider-agnostic User entityinterface AppUser {  id: string;  email: string;  roles: string;}// Define the interface for authentication operationsinterface AuthFacade {  getCurrentUser(request: Request): Promise<AppUser | null>;  verifySession(token: string): Promise<boolean>;  logout(userId: string): Promise<void>;}
By coding against this Facade interface, the core application logic remains independent of the underlying authentication provider. If the team needs to migrate from a hosted service (e.g., Clerk) to a self-hosted engine (e.g., Better Auth), they only need to implement a new version of the AuthFacade class, leaving the rest of the application unchanged.
Migration-Safe Database Schema Design
A common architectural error is utilizing the authentication provider's user ID as the primary key across all database tables. This creates tight coupling and makes migration highly difficult, especially when migrating from systems like Cognito where IDs cannot be customized during recreation.
To design a migration-safe schema, startups should utilize internal, auto-generated UUIDs as the primary key for their user records and map external identity provider IDs in a separate mapping table.
-- Core User Profile TableCREATE TABLE app_users (    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    email VARCHAR(255) UNIQUE NOT NULL,    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());-- Identity Provider Mapping TableCREATE TABLE user_identities (    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,    provider_name VARCHAR(50) NOT NULL, -- 'clerk', 'auth0', 'cognito', 'better-auth'    external_provider_id VARCHAR(255) NOT NULL,    UNIQUE(provider_name, external_provider_id));
Under this design, if the startup migrates from Cognito to Better Auth:
The core user record (app_users.id) remains completely unchanged.
The external reference in user_identities is updated to reflect the new provider's ID.
All foreign keys across downstream application tables (e.g., orders, profiles) remain intact, avoiding cascading database updates.
Security Reality Check: Hardening and Common Exploits
Implementing authentication introduces several critical security vectors that must be carefully managed to prevent unauthorized access.
Cross-Site Scripting (XSS) and Token Extraction
XSS vulnerabilities occur when malicious scripts are injected into an application, allowing attackers to access client-side memory.
The Exploit: If JWTs or access tokens are stored in localStorage or sessionStorage, an XSS exploit can extract these tokens, allowing attackers to hijack sessions.
The Mitigation: Access tokens should be stored in transient, client-side memory (such as local variables), while long-lived refresh tokens must be stored in secure, HttpOnly cookies configured with the SameSite=Strict and Secure attributes to prevent JavaScript extraction.
Cross-Site Request Forgery (CSRF)
CSRF attacks trick authenticated users into executing unwanted actions on a web application where they have an active session.
The Exploit: If an application relies solely on cookies for session validation, browser behavior will automatically append these cookies to cross-site requests, allowing malicious sites to execute unauthorized requests on behalf of the user.
The Mitigation: Developers should implement anti-CSRF tokens, validate the Origin and Referer headers, and configure cookie storage with the SameSite=Lax or SameSite=Strict attributes to prevent cookies from being sent with cross-site requests.
AI IDE and "Vibe-Coding" Security Vulnerabilities
The rise of AI-assisted code generators has introduced unique security challenges, as these tools can prioritize functional outcomes over security compliance. Common issues in AI-generated authentication code include:
Insecure Key Management: AI assistants often generate hardcoded cryptographic secrets directly within code files or suggest weak, default signing keys.
Insufficient Password Hashing: Generated code may implement low salt rounds or utilize outdated hashing algorithms (such as MD5 or SHA-1) instead of modern standards (such as Argon2id or bcrypt).
Missing Rate Limiting: AI-generated endpoints often lack rate limiting on sensitive routes (such as login or password reset), leaving applications vulnerable to brute-force and credential-stuffing attacks.
Inadequate Validation on Password Resets: Generated password reset flows sometimes lack proper validation, failing to verify token expiration or allowing password resets without validating the active reset token.
Quantitative Comparison of Authentication Systems
Evaluation Matrix
Provider / Library
Beginner Friendliness
Scaling Cost Efficiency
Pricing Predictability
Cloudflare Worker Native
Serverless Native
Enterprise Ready
Vendor Lock-In Risk
Clerk
Exceptional
Poor
Moderate
Fully Compatible
Fully Compatible
High
High
Auth0
Moderate
Poor
Poor
Compatible (via API)
Fully Compatible
Exceptional
Critical
Supabase Auth
Highly Friendly
Exceptional
Highly Predictable
Fully Compatible
Fully Compatible
Moderate
Low
Better Auth
Highly Friendly
Exceptional
Exceptional
Fully Compatible
Fully Compatible
Highly Capable
Low
Auth.js
Moderate
Exceptional
Exceptional
Requires Split Config
Fully Compatible
Moderate
Low

Keycloak
Complex
Exceptional
Exceptional
Compatible (via OIDC)
Poor
Exceptional
AWS Cognito
Extremely Low
Highly Efficient
Highly Predictable
Compatible (via API)
Fully Compatible
Exceptional
Critical
Final Strategic Recommendations
Selecting the right authentication system requires aligning the choice with the application's business model, development resources, and scalability requirements.
Scenario-Specific Architectural Playbooks
Scenario 1: Solo Developer and Rapid MVP
Strategic Choice: Better Auth paired with a managed PostgreSQL database (e.g., Neon or Supabase).
Rationale: By using Better Auth, developers can skip complex identity configurations and deploy a secure, modern stack quickly. This approach avoids managed SaaS pricing tiers as the application grows, ensuring low long-term operational costs.
Scenario 2: Bootstrapped and Pre-Revenue B2C Startup
Strategic Choice: Better Auth or Supabase Auth.
Rationale: High-volume B2C products are particularly vulnerable to steep price escalations on managed hosted platforms. Better Auth and Supabase Auth offer predictable, cost-effective options that scale alongside the underlying database compute.
Scenario 3: B2B Enterprise SaaS
Strategic Choice: WorkOS paired with Better Auth or a transition to Auth0/Okta Enterprise as enterprise budgets expand.
Rationale: Enterprise customers demand robust single sign-on (SSO) and directory synchronization (SCIM) capabilities. WorkOS provides dedicated, developer-friendly endpoints to manage these integrations without the high cost overhead of premium managed identity systems.
Scenario 4: High-Volume Mobile-First Platform
Strategic Choice: Supabase Auth or SuperTokens.
Rationale: Mobile applications require robust, reliable session management across varied network states. Supabase Auth and SuperTokens provide dedicated, lightweight SDKs that handle session persistence and automatic token rotation natively.
Scenario 5: Cloudflare-Native Edge Application
Strategic Choice: Better Auth deployed directly on Cloudflare Workers using Cloudflare D1 or Hyperdrive.
Rationale: Running authentication inside Cloudflare's serverless edge runtime requires a lightweight engine built on Web Crypto APIs. Better Auth executes natively within these environments, bypassing the execution limits and database driver restrictions of legacy frameworks.
Works cited
1. Top 10 Auth0 Complaints Developers Post on Reddit (Analysed ..., https://ssojet.com/blog/auth0-complaints-reddit-developers 2. Supabase: the real cost behind apparent simplicity - AI2H, https://ai2h.tech/en/blog/supabase-real-cost-technical-pricing 3. Kinde – Simple Authentication and User Management for Developers - Tool Questor, https://toolquestor.com/tool/kinde 4. Kinde Pricing 2026, https://www.g2.com/products/kinde/pricing 5. Is AWS Cognito still recommended for use - Reddit, https://www.reddit.com/r/aws/comments/1mtgik0/is_aws_cognito_still_recommended_for_use/ 6. Is it just me or is AWS Cognito kind of a pain to work with? - Reddit, https://www.reddit.com/r/aws/comments/112s51f/struggling_with_aws_cognito_is_it_just_me_or_is/ 7. Edge Compatibility - Auth.js, https://authjs.dev/guides/edge-compatibility 8. Lucia-auth is Deprecated: Meet the Better Alternative –... - daily.dev, https://app.daily.dev/posts/g2sydesjx 9. Clerk costs $825/month at 50k MAU. Here's the math and what we ..., https://www.reddit.com/r/reactjs/comments/1to3j82/clerk_costs_825month_at_50k_mau_heres_the_math/ 10. Lucia Auth is Dead - What's Next for Auth? - Wisp CMS, https://www.wisp.blog/blog/lucia-auth-is-dead-whats-next-for-auth 11. A fresh start · lucia-auth lucia · Discussion #1714 - GitHub, https://github.com/lucia-auth/lucia/discussions/1714 12. What Is Better Auth and Who's It For? - SuperTokens, https://supertokens.com/blog/better-auth 13. Clerk Auth New Pricing, 5x increase : r/SaaS - Reddit, https://www.reddit.com/r/SaaS/comments/1r14vm5/clerk_auth_new_pricing_5x_increase/ 14. Is Clerk really that good? : r/reactjs - Reddit, https://www.reddit.com/r/reactjs/comments/1gr5b29/is_clerk_really_that_good/ 15. Is Clerk's pricing really that insane or am I missing something? - Reddit, https://www.reddit.com/r/nextjs/comments/167pj2d/is_clerks_pricing_really_that_insane_or_am_i/ 16. supabase High CPU Usage - Alert Diagnosis, https://drdroid.io/alert-diagnosis-knowledge/supabase-high-cpu-usage 17. Troubleshooting | High CPU usage - Supabase Docs, https://supabase.com/docs/guides/troubleshooting/high-cpu-usage 18. Optimize high CPU usage in instances | Cloud SQL for PostgreSQL, https://docs.cloud.google.com/sql/docs/postgres/optimize-cpu-usage 19. Why does Cognito get a bad wrap? : r/aws - Reddit, https://www.reddit.com/r/aws/comments/11q1j8e/why_does_cognito_get_a_bad_wrap/ 20. Amazon Cognito vs Kinde: Features, Pricing and User Reviews 2026 - Tool Questor, https://toolquestor.com/vs/amazon-cognito-vs-kinde 21. Warning to Developers using AWS Cognito. - Reddit, https://www.reddit.com/r/aws/comments/1oklzut/warning_to_developers_using_aws_cognito/ 22. Are all of AWS services of such terrible quality as Cognito service/team is? - Reddit, https://www.reddit.com/r/aws/comments/ybztqr/are_all_of_aws_services_of_such_terrible_quality/ 23. Feature Flags Plugin | Better Auth Plugins - Kriasoft, https://kriasoft.com/better-auth/feature-flags/overview.html
