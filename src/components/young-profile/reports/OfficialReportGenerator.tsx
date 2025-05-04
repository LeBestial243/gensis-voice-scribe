import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ReportSection {
  title: string;
  content: string | { [key: string]: any };
}

export function OfficialReportGenerator() {
  const [sections, setSections] = useState<ReportSection[]>([
    { title: "Informations générales", content: "Contenu par défaut" },
    { title: "Observations", content: { "Observation 1": "Détails", "Observation 2": "Autres détails" } }
  ]);

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');

  const addSection = () => {
    if (newSectionTitle) {
      setSections([...sections, { title: newSectionTitle, content: newSectionContent }]);
      setNewSectionTitle('');
      setNewSectionContent('');
    }
  };

  const renderReportSections = (sections: any) => {
    // Add null check and ensure sections is an array before mapping
    if (!sections || !Array.isArray(sections)) {
      return null;
    }
    
    return sections.map((section, index) => (
      <div key={index} className="mb-6">
        <h3 className="text-lg font-medium mb-2">{section.title}</h3>
        {section.content && (
          <div className="prose prose-sm max-w-none">
            {typeof section.content === 'string' 
              ? <p>{section.content}</p> 
              : Object.entries(section.content).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))
            }
          </div>
        )}
      </div>
    ));
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Sections du Rapport</h2>
          {renderReportSections(sections)}
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Ajouter une Section</h2>
          <div>
            <Label htmlFor="new-section-title">Titre de la Section</Label>
            <Input
              id="new-section-title"
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Titre"
            />
          </div>
          <div>
            <Label htmlFor="new-section-content">Contenu de la Section</Label>
            <Input
              id="new-section-content"
              type="text"
              value={newSectionContent}
              onChange={(e) => setNewSectionContent(e.target.value)}
              placeholder="Contenu"
            />
          </div>
          <Button onClick={addSection}>Ajouter Section</Button>
        </section>
      </CardContent>
    </Card>
  );
}
