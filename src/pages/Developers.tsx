import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { Code, Rocket, DollarSign, Users } from 'lucide-react';

const Developers = () => {
  return (
    <>
      <Helmet>
        <title>For Developers - 5 Minutes Games</title>
        <meta name="description" content="Submit your HTML5 games to 5 Minutes Games and reach millions of players worldwide." />
      </Helmet>

      <Layout>
        <PageHeader
          title="For Developers"
          description="Partner with us to showcase your games to millions of players worldwide."
        />

        <section className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Code, title: 'Easy Integration', description: 'Simple HTML5 game submission process' },
              { icon: Rocket, title: 'Wide Reach', description: 'Access millions of players globally' },
              { icon: DollarSign, title: 'Revenue Share', description: 'Competitive revenue sharing model' },
              { icon: Users, title: 'Community', description: 'Join our developer community' },
            ].map((item, index) => (
              <div
                key={item.title}
                className="p-6 rounded-xl bg-card border border-border animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <item.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Submit Your Game</h2>
            <p className="text-muted-foreground mb-6">
              We're always looking for exciting new HTML5 games to feature on our platform. If you're a game developer with quality content, we'd love to hear from you.
            </p>
            <p className="text-muted-foreground">
              Contact us at <span className="text-primary">developers@5minutesgames.com</span> with your game details.
            </p>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default Developers;
