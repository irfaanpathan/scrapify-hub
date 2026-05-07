import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle, Clock, MapPin, LifeBuoy } from "lucide-react";

const SUPPORT_PHONE = "+91 98765 43210";
const SUPPORT_EMAIL = "support@scrapy5.com";
const BUSINESS_EMAIL = "business@scrapy5.com";
const WHATSAPP_NUMBER = "919876543210"; // international format, no +
const BUSINESS_HOURS = "Mon – Sat, 9:00 AM – 7:00 PM";

const HelpSupport = () => {
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi Scrapy5, I need help with my order."
  )}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 max-w-3xl pb-24">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <LifeBuoy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Help & Support</h1>
            <p className="text-sm text-muted-foreground">We're here to help you 7 days a week.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-elevated transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-primary" /> Contact Number
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-lg font-semibold text-foreground">{SUPPORT_PHONE}</p>
              <Button asChild className="w-full">
                <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}>Call Now</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevated transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4 text-primary" /> Email Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-base font-medium text-foreground break-all">{SUPPORT_EMAIL}</p>
              <Button asChild variant="outline" className="w-full">
                <a href={`mailto:${SUPPORT_EMAIL}`}>Send Email</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevated transition-shadow md:col-span-2 bg-success/5 border-success/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-success" /> WhatsApp Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/80">
                Chat with us on WhatsApp for instant help with pickups, prices, or order updates.
              </p>
              <Button
                asChild
                className="w-full bg-success hover:bg-success/90 text-success-foreground"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> Chat on WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                Business & Bulk Pickups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-foreground/90">
                For bulk scrap pickups, corporate tie-ups, or industrial partnerships, reach out to
                our business team.
              </p>
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a href={`mailto:${BUSINESS_EMAIL}`} className="font-medium hover:underline">
                  {BUSINESS_EMAIL}
                </a>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>{BUSINESS_HOURS}</span>
              </div>
              <div className="flex items-start gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>Scrapy5 HQ, India</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
