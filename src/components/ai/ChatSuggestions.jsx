import React from 'react';
import { motion } from 'framer-motion';

const ChatSuggestions = ({ prompts, onPromptSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        <h2 className="text-xl font-semibold text-slate-300 mb-2">Como posso te ajudar hoje?</h2>
        <p className="text-slate-400 mb-6">Selecione uma das sugestões abaixo ou digite sua pergunta.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prompts.map((prompt, index) => {
            const Icon = prompt.icon;
            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(30, 41, 59, 1)' }}
                onClick={() => onPromptSelect(prompt.text)}
                className="text-left p-4 rounded-lg bg-slate-800/60 border border-slate-700 hover:border-cyan-400/50 transition-colors flex items-start gap-4"
              >
                <Icon className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                <span className="text-slate-200 text-sm">{prompt.text}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default ChatSuggestions;