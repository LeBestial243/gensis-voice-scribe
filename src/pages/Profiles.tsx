
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateProfileForm } from '@/components/CreateProfileForm';

export default function Profiles() {
  const [open, setOpen] = useState(false);

  return (
    <div className="container mx-auto py-6 px-4">
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
    </div>
  );
}
