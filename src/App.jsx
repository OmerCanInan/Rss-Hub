import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { TranslationProvider } from './context/TranslationContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import NewsFeed from './pages/NewsFeed';

function App() {
  return (
    <TranslationProvider>
      <Router>
        <div className="app-container app-theme-dark">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/news" element={<NewsFeed />} />
            </Routes>
          </main>
        </div>
      </Router>
    </TranslationProvider>
  );
}

export default App;
