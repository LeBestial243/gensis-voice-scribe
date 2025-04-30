
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { SectionItem } from "./SectionItem";

interface Section {
  id: string;
  title: string;
  instructions: string;
}

interface SectionsListProps {
  sections: Section[];
  onAddSection: () => void;
  onRemoveSection: (index: number) => void;
  onSectionChange: (index: number, field: 'title' | 'instructions', value: string) => void;
  onDragEnd: (result: any) => void;
}

export function SectionsList({
  sections,
  onAddSection,
  onRemoveSection,
  onSectionChange,
  onDragEnd
}: SectionsListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Sections du template</h3>
        <Button type="button" onClick={onAddSection} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Ajouter une section
        </Button>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {sections.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <SectionItem
                          section={section}
                          index={index}
                          onRemove={() => onRemoveSection(index)}
                          onTitleChange={(value) => onSectionChange(index, 'title', value)}
                          onInstructionsChange={(value) => onSectionChange(index, 'instructions', value)}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ScrollArea>
    </div>
  );
}
