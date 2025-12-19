import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { TrendingUp, Globe, Handshake, Gift } from 'lucide-react';

const Affiliates = () => {
  return (
    <>
      <Helmet>
        <title>Affiliate Program - 5 Minutes Games</title>
        <meta name="description" content="Join our affiliate program and earn by promoting 5 Minutes Games." />
      </Helmet>

      <Layout>
        <PageHeader
          title="Affiliate Program"
          description="Earn money by promoting our games to your audience."
        />

        <section className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: TrendingUp, title: 'High Commission', description: 'Competitive rates on all referrals' },
              { icon: Globe, title: 'Global Tracking', description: 'Track your earnings from anywhere' },
              { icon: Handshake, title: 'Dedicated Support', description: 'Personal affiliate manager' },
              { icon: Gift, title: 'Bonuses', description: 'Special bonuses for top performers' },
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
            <h2 className="text-2xl font-bold mb-4">Join Our Affiliate Program</h2>
            <p className="text-muted-foreground mb-6">
              Whether you're a content creator, website owner, or influencer, our affiliate program offers great opportunities to monetize your traffic.
            </p>
            <p className="text-muted-foreground">
              Apply now at <span className="text-primary">affiliates@5minutesgames.com</span>
            </p>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default Affiliates;
