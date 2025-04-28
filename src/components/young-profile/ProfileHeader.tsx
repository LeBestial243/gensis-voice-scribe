
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { differenceInYears, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface ProfileHeaderProps {
  profile: {
    first_name: string;
    last_name: string;
    birth_date?: string;
    structure?: string;
    arrival_date?: string;
  };
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const navigate = useNavigate();

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return format(parseISO(date), 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-gensys-glassmorphism-light backdrop-blur-sm border-b">
        <div className="container flex items-center h-16">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/profiles')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg md:text-xl font-bold truncate">
            {profile.first_name} {profile.last_name}
          </h1>
        </div>
      </header>

      <Card className="bg-gradient-to-r from-gensys-primary-from/5 via-gensys-primary-via/5 to-gensys-primary-to/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">
            {profile.first_name} {profile.last_name}
          </CardTitle>
          <CardDescription>
            {profile.birth_date && calculateAge(profile.birth_date) && (
              <span className="mr-2">{calculateAge(profile.birth_date)} ans</span>
            )}
            {profile.structure && (
              <span className="mr-2">• {profile.structure}</span>
            )}
            {profile.arrival_date && (
              <span>• Arrivé(e) le {formatDate(profile.arrival_date)}</span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
