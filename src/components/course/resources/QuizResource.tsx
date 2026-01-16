import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trophy,
  RefreshCw,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizResourceProps {
  title: string;
  questions?: QuizQuestion[];
  passingScore?: number;
  onComplete: (score: number, passed: boolean) => void;
  onClose: () => void;
}

// Demo questions
const demoQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: 'What is the primary benefit of using components in React?',
    options: ['Faster loading', 'Reusability and modularity', 'Better SEO', 'More animations'],
    correctAnswer: 1,
    explanation: 'Components allow you to break down UI into independent, reusable pieces.'
  },
  {
    id: '2',
    question: 'Which hook is used for side effects in React?',
    options: ['useState', 'useEffect', 'useContext', 'useReducer'],
    correctAnswer: 1,
    explanation: 'useEffect is specifically designed for handling side effects like data fetching.'
  },
  {
    id: '3',
    question: 'What does JSX stand for?',
    options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extra'],
    correctAnswer: 0,
    explanation: 'JSX stands for JavaScript XML, allowing you to write HTML-like syntax in JavaScript.'
  },
  {
    id: '4',
    question: 'How do you pass data from parent to child components?',
    options: ['Context API', 'Redux', 'Props', 'State'],
    correctAnswer: 2,
    explanation: 'Props (properties) are the standard way to pass data from parent to child components.'
  }
];

const QuizResource = ({ 
  title, 
  questions = demoQuestions, 
  passingScore = 75,
  onComplete, 
  onClose 
}: QuizResourceProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [isFinished, setIsFinished] = useState(false);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Calculate score
      const correctCount = answers.filter((a, i) => a === questions[i].correctAnswer).length;
      const score = Math.round((correctCount / questions.length) * 100);
      setIsFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers(new Array(questions.length).fill(null));
    setIsFinished(false);
  };

  const correctCount = answers.filter((a, i) => a === questions[i].correctAnswer).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= passingScore;

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
            className={cn(
              'w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4',
              passed ? 'bg-success/20' : 'bg-destructive/20'
            )}
          >
            {passed ? (
              <Trophy className="w-12 h-12 text-success" />
            ) : (
              <XCircle className="w-12 h-12 text-destructive" />
            )}
          </motion.div>

          <h3 className="text-2xl font-bold text-foreground mb-2">
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {passed 
              ? 'You passed the quiz!' 
              : `You need ${passingScore}% to pass. Try again!`}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="text-4xl font-bold text-foreground mb-1">{score}%</div>
            <p className="text-sm text-muted-foreground">
              {correctCount} of {questions.length} correct
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            {!passed && (
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Quiz
              </Button>
            )}
            <Button 
              onClick={() => onComplete(score, passed)}
              className="bg-gradient-accent"
            >
              {passed ? 'Continue' : 'Skip for now'}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h4 className="text-lg font-medium text-foreground mb-4">
              {question.question}
            </h4>

            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correctAnswer;
                const showCorrectness = showResult;

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className={cn(
                      'w-full p-4 rounded-lg border-2 text-left transition-all',
                      isSelected && !showCorrectness && 'border-accent bg-accent/10',
                      !isSelected && !showCorrectness && 'border-border hover:border-accent/50',
                      showCorrectness && isCorrect && 'border-success bg-success/10',
                      showCorrectness && isSelected && !isCorrect && 'border-destructive bg-destructive/10',
                      showCorrectness && !isSelected && !isCorrect && 'border-border opacity-50'
                    )}
                    whileHover={{ scale: showResult ? 1 : 1.01 }}
                    whileTap={{ scale: showResult ? 1 : 0.99 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        isSelected && !showCorrectness && 'bg-accent text-accent-foreground',
                        !isSelected && !showCorrectness && 'bg-muted text-muted-foreground',
                        showCorrectness && isCorrect && 'bg-success text-success-foreground',
                        showCorrectness && isSelected && !isCorrect && 'bg-destructive text-destructive-foreground'
                      )}>
                        {showCorrectness && isCorrect ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : showCorrectness && isSelected && !isCorrect ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </div>
                      <span className="text-foreground">{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResult && question.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-muted/50 rounded-lg"
              >
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Explanation: </span>
                  {question.explanation}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!showResult ? (
          <Button 
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            className="w-full bg-gradient-accent"
          >
            Submit Answer
          </Button>
        ) : (
          <Button 
            onClick={handleNext}
            className="w-full bg-gradient-accent"
          >
            {currentQuestion < questions.length - 1 ? (
              <>
                Next Question
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              'See Results'
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default QuizResource;
