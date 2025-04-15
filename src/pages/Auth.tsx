
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Nouveaux champs pour l'inscription
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [establishment, setEstablishment] = useState('');
  const [youthCount, setYouthCount] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      setErrorMessage(error.message);
      toast({ 
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    
    if (!email || !password || !firstName || !lastName) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires");
      setLoading(false);
      return;
    }
    
    try {
      // Créer l'utilisateur avec les métadonnées supplémentaires
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            title,
            first_name: firstName,
            last_name: lastName,
            establishment,
            youth_count: youthCount ? parseInt(youthCount) : null
          },
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Inscription réussie",
        description: "Veuillez vérifier votre email pour confirmer votre compte."
      });

      // Retour à l'écran de connexion après inscription
      setIsRegisterMode(false);
      resetForm();
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      setErrorMessage(error.message);
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setTitle('');
    setFirstName('');
    setLastName('');
    setEstablishment('');
    setYouthCount('');
    setErrorMessage(null);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    resetForm();
  };

  return (
    <div className="container max-w-lg mx-auto p-4 h-screen flex items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{isRegisterMode ? "Créer un compte" : "Connexion"}</CardTitle>
          <CardDescription>
            {isRegisterMode 
              ? "Inscrivez-vous pour créer un nouveau compte" 
              : "Connectez-vous ou créez un compte pour continuer"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {isRegisterMode ? (
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <Label htmlFor="title">Civilité</Label>
                <Select value={title} onValueChange={setTitle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M.">M.</SelectItem>
                    <SelectItem value="Mme">Mme</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="establishment">Nom de l'établissement</Label>
                <Input
                  id="establishment"
                  value={establishment}
                  onChange={(e) => setEstablishment(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youthCount">Nombre de jeunes</Label>
                <Input
                  id="youthCount"
                  type="number"
                  min="0"
                  value={youthCount}
                  onChange={(e) => setYouthCount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                Créer un compte
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                Se connecter
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={toggleMode}
            disabled={loading}
          >
            {isRegisterMode ? "Déjà un compte ? Se connecter" : "Créer un compte"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
