import { Layout } from "@/components/Layout";
import { useWords, useCreateWord, useUpdateWord, useDeleteWord, useGenerateAiQuestions } from "@/hooks/use-words";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWordSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Pencil, Trash2, Search, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const wordFormSchema = insertWordSchema;
type WordFormValues = z.infer<typeof wordFormSchema>;

export default function ManageVocabulary() {
  const { data: words, isLoading } = useWords();
  const generateAiQuestions = useGenerateAiQuestions();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<WordFormValues & { id: number } | null>(null);
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [aiResults, setAiResults] = useState<any[] | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const filteredWords = words?.filter(word => 
    word.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectWord = (id: number) => {
    setSelectedWords(prev => 
      prev.includes(id) ? prev.filter(wordId => wordId !== id) : [...prev, id]
    );
  };

  const handleGenerateAI = () => {
    if (selectedWords.length === 0) {
      toast({
        title: "No words selected",
        description: "Please select at least one word to generate questions for.",
        variant: "destructive"
      });
      return;
    }

    generateAiQuestions.mutate({ wordIds: selectedWords }, {
      onSuccess: (data) => {
        setAiResults(data);
        setIsAiModalOpen(true);
        setSelectedWords([]);
      }
    });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Vocabulary</h1>
          <p className="text-muted-foreground mt-1">Manage the global word list for all students.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleGenerateAI}
            disabled={selectedWords.length === 0 || generateAiQuestions.isPending}
          >
            {generateAiQuestions.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-500" />
            )}
            AI Generate ({selectedWords.length})
          </Button>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search words..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => { setEditingWord(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Word
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredWords?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No words found. Add some vocabulary to get started.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[200px]">Term</TableHead>
                <TableHead>Definition</TableHead>
                <TableHead className="w-[120px]">Part of Speech</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWords?.map((word) => (
                <TableRow key={word.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Checkbox 
                      checked={selectedWords.includes(word.id)}
                      onCheckedChange={() => toggleSelectWord(word.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{word.term}</TableCell>
                  <TableCell className="text-muted-foreground">{word.definition}</TableCell>
                  <TableCell>
                    {word.partOfSpeech && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        {word.partOfSpeech}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => { setEditingWord(word); setIsDialogOpen(true); }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <DeleteWordButton id={word.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <WordDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        initialData={editingWord}
      />

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-6 h-6 text-purple-500" />
              <DialogTitle>AI Generated Questions</DialogTitle>
            </div>
            <DialogDescription>
              Gemini has analyzed your vocabulary and generated these multiple choice questions.
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                This feature uses Replit AI Integrations for Gemini access. Charges are billed to your credits.
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {aiResults?.map((q, i) => (
              <div key={i} className="border rounded-lg p-4 bg-muted/20">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-lg leading-tight">Q: {q.questionText}</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {q.options.map((opt: string, j: number) => (
                    <div 
                      key={j} 
                      className={`p-2 rounded border text-sm ${opt === q.correctAnswer ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400 font-medium' : 'bg-background'}`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground border-t pt-3 mt-3">
                  <p><span className="font-bold text-foreground">Explanation:</span> {q.explanation}</p>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsAiModalOpen(false)} className="w-full">
              Close & Finish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function DeleteWordButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeleteWord();
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        if (confirm("Are you sure? This will delete student progress for this word.")) {
          mutate(id);
        }
      }}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

function WordDialog({ 
  open, 
  onOpenChange, 
  initialData 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  initialData: WordFormValues & { id: number } | null;
}) {
  const { mutate: createWord, isPending: isCreating } = useCreateWord();
  const { mutate: updateWord, isPending: isUpdating } = useUpdateWord();
  
  const form = useForm<WordFormValues>({
    resolver: zodResolver(wordFormSchema),
    defaultValues: initialData || {
      term: "",
      definition: "",
      partOfSpeech: "",
      exampleSentence: "",
      status: "Active",
      phase: 1
    },
    values: initialData || undefined
  });

  const onSubmit = (data: WordFormValues) => {
    if (initialData) {
      updateWord({ id: initialData.id, ...data }, {
        onSuccess: () => { onOpenChange(false); form.reset(); }
      });
    } else {
      createWord(data, {
        onSuccess: () => { onOpenChange(false); form.reset(); }
      });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Word" : "Add New Word"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Input {...form.register("term")} placeholder="e.g. Ubiquitous" />
              {form.formState.errors.term && (
                <p className="text-xs text-destructive">{form.formState.errors.term.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Part of Speech</label>
              <Input {...form.register("partOfSpeech")} placeholder="e.g. Adjective" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Definition</label>
            <Textarea {...form.register("definition")} placeholder="Enter the definition..." rows={3} />
            {form.formState.errors.definition && (
              <p className="text-xs text-destructive">{form.formState.errors.definition.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Example Sentence</label>
            <Input {...form.register("exampleSentence")} placeholder="Use it in a sentence..." />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {initialData ? "Update Word" : "Create Word"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
