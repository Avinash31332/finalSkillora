import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

export default function Skills() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Skills Marketplace</h1>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          This page is coming soon! Continue prompting to help build out the skills marketplace 
          where users can browse and offer their skills.
        </p>
        <Button variant="outline">Back to Home</Button>
      </div>
    </div>
  );
}
