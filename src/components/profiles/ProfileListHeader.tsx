
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CreateProfileForm } from "@/components/CreateProfileForm";

interface ProfileListHeaderProps {
  openCreateProfile: boolean;
  setOpenCreateProfile: (open: boolean) => void;
}

export function ProfileListHeader({ openCreateProfile, setOpenCreateProfile }: ProfileListHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-title">Mes profils</h1>
      <Dialog open={openCreateProfile} onOpenChange={setOpenCreateProfile}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-[#9867F0] to-[#5B86E5] text-white px-4 py-2 font-semibold rounded-full shadow-md hover:shadow-lg transition duration-300 ease-in-out">
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
  );
}
