import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - 5 Minutes Games</title>
        <meta name="description" content="Read our privacy policy to understand how we handle your data at 5 Minutes Games." />
      </Helmet>

      <Layout>
        <PageHeader
          title="Privacy Policy"
          description="Last updated: December 2024"
        />

        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto bg-card rounded-xl border border-border p-8">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground">
                  We collect minimal information necessary to provide our gaming services. This may include usage analytics, device information, and any information you voluntarily provide through contact forms.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  We use collected information to improve our services, analyze user behavior to enhance the gaming experience, and respond to inquiries. We do not sell your personal information to third parties.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">3. Cookies</h2>
                <p className="text-muted-foreground">
                  We use cookies to enhance your experience on our platform. These cookies help us remember your preferences and understand how you interact with our games.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">4. Third-Party Services</h2>
                <p className="text-muted-foreground">
                  Our games may be hosted by third-party services. These services have their own privacy policies, and we encourage you to review them.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">5. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our services are intended for general audiences. We do not knowingly collect personal information from children under 13.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">6. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at <span className="text-primary">privacy@5minutesgames.com</span>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default PrivacyPolicy;
