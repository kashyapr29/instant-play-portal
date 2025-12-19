import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { Heart, Target, Users, Sparkles } from 'lucide-react';

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us - 5 Minutes Games</title>
        <meta name="description" content="Learn about 5 Minutes Games - your destination for free online browser games." />
      </Helmet>

      <Layout>
        <PageHeader
          title="About Us"
          description="Your destination for quick, fun, and free online games."
        />

        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-invert mx-auto mb-12">
              <p className="text-lg text-muted-foreground leading-relaxed">
                5 Minutes Games was founded with a simple mission: to provide high-quality, free games that anyone can enjoy during a short break. Whether you have five minutes or five hours, we've curated a collection of games that are perfect for quick entertainment.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[
                { icon: Heart, title: 'Our Mission', description: 'To make gaming accessible to everyone, everywhere, without barriers.' },
                { icon: Target, title: 'Our Vision', description: 'To become the go-to platform for casual browser gaming worldwide.' },
                { icon: Users, title: 'Our Community', description: 'Millions of players enjoy our games every month from around the globe.' },
                { icon: Sparkles, title: 'Our Promise', description: 'Always free, always fun, always accessible.' },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="p-6 rounded-xl bg-card border border-border animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <item.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-border">
              <h2 className="text-2xl font-bold mb-4">Join Our Journey</h2>
              <p className="text-muted-foreground">
                We're constantly adding new games and features. Stay tuned for exciting updates!
              </p>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default About;
