import { createFileRoute } from '@tanstack/react-router'
import { Mail, MapPin, Phone } from 'lucide-react'

export const Route = createFileRoute('/_public/contact')({
  head: () => ({
    meta: [
      { title: "Contact | Radiant Worship" },
      { name: "description", content: "Get in touch with the Radiant Worship ministry team for inquiries, service schedules, or ministry opportunities." },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-6 py-24 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="font-serif text-5xl mb-6">Contact Us</h1>
        <p className="text-muted-foreground">We'd love to hear from you. Reach out to our ministry team for any questions or inquiries.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h3 className="font-serif text-2xl">Ministry Office</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-muted-foreground">
              <MapPin className="w-5 h-5 text-accent" />
              <span>123 Worship Way, City, State</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Mail className="w-5 h-5 text-accent" />
              <span>hello@radiantworship.com</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Phone className="w-5 h-5 text-accent" />
              <span>(555) 123-4567</span>
            </div>
          </div>
        </div>

        <div className="p-8 bg-muted/20 border border-accent/10">
           <p className="text-sm text-muted-foreground italic">Ministry contact forms have been temporarily disabled to prevent spam. Please reach out to us via email for direct assistance.</p>
        </div>
      </div>
    </div>
  ),
})