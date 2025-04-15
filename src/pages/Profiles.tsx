
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, Mic, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreateProfileForm } from '@/components/CreateProfileForm';
import { ProfileList } from '@/components/ProfileList';
import { MobileNav } from '@/components/MobileNav';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TranscriptionDialog } from '@/components/TranscriptionDialog';

export default function Profiles() {
  const [openCreateProfile, setOpenCreateProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelectProfile = (profileId: string) => {
    navigate(`/profile/${profileId}`);
  };

  return (
    <div className="container mx-auto py-6 px-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes profils</h1>
        <Dialog open={openCreateProfile} onOpenChange={setOpenCreateProfile}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un profil
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Créer un nouveau profil</DialogTitle>
            </DialogHeader>
            <CreateProfileForm />
          </DialogContent>
        </Dialog>
      </div>

      <ProfileList onSelectProfile={handleSelectProfile} />
      <MobileNav />
    </div>
  );
}
