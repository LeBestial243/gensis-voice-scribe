
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateProfileForm } from '@/components/CreateProfileForm';
import { ProfileList } from '@/components/ProfileList';
import { MobileNav } from '@/components/MobileNav';

export default function Profiles() {
  const [open, setOpen] = useState(false);

  return (
    <div className="container mx-auto py-6 px-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes profils</h1>
        <Dialog open={open} onOpenChange={setOpen}>
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

      <ProfileList />
      <MobileNav />
    </div>
  );
}
