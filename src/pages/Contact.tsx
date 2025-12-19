import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { Mail, MessageSquare, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us - 5 Minutes Games</title>
        <meta name="description" content="Get in touch with the 5 Minutes Games team. We'd love to hear from you." />
      </Helmet>

      <Layout>
        <PageHeader
          title="Contact Us"
          description="Have questions? We'd love to hear from you."
        />

        <section className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Mail, title: 'Email', value: 'hello@5minutesgames.com', description: 'Send us an email anytime' },
              { icon: MessageSquare, title: 'Support', value: 'support@5minutesgames.com', description: 'For technical issues' },
              { icon: MapPin, title: 'Location', value: 'San Francisco, CA', description: 'Our headquarters' },
            ].map((item, index) => (
              <div
                key={item.title}
                className="p-6 rounded-xl bg-card border border-border text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-primary mb-1">{item.value}</p>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto bg-card rounded-xl border border-border p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Send us a Message</h2>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none transition-colors"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none transition-colors resize-none"
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default Contact;
