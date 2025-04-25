
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    structure?: string;
    arrival_date: string;
    health_info?: string;
    situation_summary?: string;
  };
  isOpen: boolean;
  onToggle: (id: string) => void;
}

export function ProfileCard({ profile, isOpen, onToggle }: ProfileCardProps) {
  return (
    <Card 
      className="bg-[#F0F4FF] hover:scale-[1.01] transition-all duration-300 ease-in-out cursor-pointer shadow-[8px_8px_16px_rgba(0,0,0,0.1),_-8px_-8px_16px_rgba(255,255,255,0.7)]"
      onClick={() => onToggle(profile.id)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold tracking-tight text-gray-800 font-dmsans">
            {profile.first_name} {profile.last_name}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 font-dmsans">
            {profile.structure || "Aucune structure"} • 
            {new Date(profile.arrival_date).toLocaleDateString('fr-FR')}
          </CardDescription>
        </div>
        <ChevronDown 
          className={cn(
            "h-5 w-5 text-gray-500 transition-transform duration-300",
            isOpen && "transform rotate-180"
          )} 
        />
      </CardHeader>
      <CardContent>
        {isOpen && (
          <div className="animate-accordion-down space-y-4 pt-2">
            {profile.health_info && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Santé</h4>
                <p className="text-sm text-gray-600">{profile.health_info}</p>
              </div>
            )}
            {profile.situation_summary && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Rappel de situation</h4>
                <p className="text-sm text-gray-600">{profile.situation_summary}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
