'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import type { ApiResponse } from '@/types'

export default function BackloggdImporter() {
  const [activeTab, setActiveTab] = useState<'link' | 'json'>('link')
  const [backloggdUrl, setBackloggdUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [lastProcessedGame, setLastProcessedGame] = useState<any>(null)

  const extractUsername = (url: string): string | null => {
    // Поддерживаем форматы:
    // https://www.backloggd.com/u/username
    // https://backloggd.com/u/username
    // https://www.backloggd.com/u/username/
    // https://backloggd.com/u/username/
    // backloggd.com/u/username
    // username
    
    // Убираем пробелы в начале и конце
    const trimmedUrl = url.trim();
    
    // Если это просто username без URL
    if (!trimmedUrl.includes('/')) {
      return trimmedUrl;
    }
    
    // Ищем username в URL
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?backloggd\.com\/u\/([^/?\s]+)/,
      /backloggd\.com\/u\/([^/?\s]+)/
    ];
    
    for (const pattern of patterns) {
      const match = trimmedUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  // Функции для генерации сообщений
  const generateGameMessage = (game: any) => {
    const messages = [
      game.rating ? `You rated ${game.name} ${game.rating} out of 10? You nuts?` : `You played ${game.name}? Good choice!`,
      `You played ${game.name}? Good choice!`,
      `Found ${game.name} in your collection. Pathetic!`,
      `Analyzing ${game.name}... Do you know this game is for idiots?`,
      `Processing ${game.name} - solid game!`,
      `You completed ${game.name}? What a waste of time!`,
      game.rating ? `Found ${game.name} with ${game.rating}/10 rating. Really?` : `Found ${game.name} without rating. Coward!`,
      `Analyzing ${game.name}... that's a classic!`,
      `Processing ${game.name} - great taste!`,
      `You played ${game.name}? Excellent choice!`,
      `I didn't want to tell you, but ${game.name} sucks.`,
      `According to statistics, 95% of autistic people play ${game.name}`,
      `I see ${game.name} is made on ${game.igdbgameinfo?.game_engines_readable?.[0] || 'unknown engine'}! Are you experiencing any lag?`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  const generateRateLimitedMessage = () => {
    return "Oh, no. Backloggd thinks we're DDoSing it. The number of requests per second has been reduced, and this may take a little longer";
  }

  const generateFrozenMessage = () => {
    return "The site isn't frozen! The scripts are just waiting for Backloggd to let us through again";
  }

  // Мониторинг загрузки
  useEffect(() => {
    if (!loading) return;

    let frozenTimeout: NodeJS.Timeout;

    // Если через 30 секунд ничего не меняется, показываем frozen message
    frozenTimeout = setTimeout(() => {
      if (loading && !isRateLimited) {
        setIsRateLimited(true);
        setLoadingMessage(generateFrozenMessage());
      }
    }, 30000);

    return () => {
      if (frozenTimeout) clearTimeout(frozenTimeout);
    };
  }, [loading, isRateLimited]);

  const handleFetchFromBackloggd = async () => {
    setError('')
    setResult(null)
    setUserInfo(null)
    setLoadingMessage('')
    setIsRateLimited(false)
    setLastProcessedGame(null)
    
    const username = extractUsername(backloggdUrl)
    
    if (!username) {
      setError('Please enter a valid Backloggd username or URL')
      return
    }

    setLoading(true)
    setLoadingMessage('Fetching your profile...')

    try {
      // Сначала получаем информацию о пользователе с количеством игр
      console.log('Fetching user info...')
      setLoadingMessage('Fetching your profile...')
      
      const userResponse = await axios.get<ApiResponse>(
        `http://localhost:8080/user/${username}`
      )
      
      console.log('User response:', userResponse.data)
      setUserInfo(userResponse.data.content)
      setLoadingMessage('Profile loaded! Starting to analyze your games...')
      console.log('User info:', userResponse.data.content)
      
      // Затем получаем все игры
      console.log('Fetching games...')
      setLoadingMessage('Analyzing your games...')
      
      // Симулируем обработку игр
      const gamesResponse = await axios.get<ApiResponse>(
        `http://localhost:8080/user/${username}/games?all=true`
      )
      
      console.log('Games response:', gamesResponse.data)
      
      // Симулируем анализ игр
      if (gamesResponse.data.content?.games) {
        const games = gamesResponse.data.content.games;
        console.log(`Found ${games.length} games to analyze`);
        
        // Показываем первые несколько игр для анализа
        let processedCount = 0;
        const maxGamesToShow = Math.min(10, games.length); // Показываем максимум 10 игр
        
        const processGames = () => {
          if (processedCount < maxGamesToShow) {
            const game = games[processedCount];
            console.log(`Processing game ${processedCount + 1}/${maxGamesToShow}: ${game.name}`);
            setLastProcessedGame(game);
            setLoadingMessage(generateGameMessage(game));
            processedCount++;
            
            // Симулируем задержку обработки
            setTimeout(processGames, 3000);
          } else {
            setResult(gamesResponse.data);
            setLoadingMessage('Analysis complete! Redirecting to stats...')
            
            // Сохраняем данные в localStorage и перенаправляем на страницу статистики
            localStorage.setItem('backloggdData', JSON.stringify(gamesResponse.data))
            localStorage.setItem('userInfo', JSON.stringify(userResponse.data.content))
            
            setTimeout(() => {
              window.location.href = '/stats'
            }, 1000)
          }
        };
        
        // Начинаем анализ через 1 секунду
        setTimeout(processGames, 1000);
      } else {
        setResult(gamesResponse.data)
        setLoadingMessage('Analysis complete! Redirecting to stats...')
        
        // Сохраняем данные в localStorage и перенаправляем на страницу статистики
        localStorage.setItem('backloggdData', JSON.stringify(gamesResponse.data))
        localStorage.setItem('userInfo', JSON.stringify(userResponse.data.content))
        
        setTimeout(() => {
          window.location.href = '/stats'
        }, 1000)
      }
    } catch (err: any) {
      console.error('Error during fetch:', err)
      setError(err.response?.data?.message || err.message || 'Failed to fetch data')
      setLoadingMessage('Error occurred during analysis')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file)
        setError('')
      } else {
        setError('Please select a valid JSON file')
        setSelectedFile(null)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file)
        setError('')
      } else {
        setError('Please drop a valid JSON file')
        setSelectedFile(null)
      }
    }
  }

  const handleImportJson = async () => {
    setError('')
    setResult(null)

    if (!selectedFile) {
      setError('Please select a file first')
      return
    }

    setLoading(true)

    try {
      const fileContent = await selectedFile.text()
      const parsed = JSON.parse(fileContent)
      setResult(parsed)
      
      // Сохраняем данные в localStorage и перенаправляем на страницу статистики
      localStorage.setItem('backloggdData', JSON.stringify(parsed))
      window.location.href = '/stats'
    } catch (err) {
      setError('Invalid JSON format. Please check your file.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadJson = () => {
    if (!result) return

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backloggd-data-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyJson = () => {
    if (!result) return
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    alert('JSON copied to clipboard!')
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tabs */}
      <div className="bg-gray-800 rounded-t-lg p-1 flex gap-2">
        <button
          onClick={() => setActiveTab('link')}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
            activeTab === 'link'
              ? 'bg-primary text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Enter Backloggd Link
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
            activeTab === 'json'
              ? 'bg-primary text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Import JSON
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-800 rounded-b-lg p-8 shadow-2xl">
        {activeTab === 'link' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Backloggd Username or Profile URL
              </label>
              <input
                type="text"
                value={backloggdUrl}
                onChange={(e) => setBackloggdUrl(e.target.value)}
                placeholder="username or https://www.backloggd.com/u/username"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleFetchFromBackloggd}
              disabled={loading || !backloggdUrl}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? 'Fetching Games...' : 'Fetch All Games'}
            </button>

          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Select JSON file
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="json-file-input"
                  disabled={loading}
                />
                <label
                  htmlFor="json-file-input"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex items-center justify-center w-full px-4 py-12 bg-gray-700 text-gray-400 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                    isDragging
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-gray-600 hover:border-primary hover:bg-gray-700/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">📁</div>
                    {selectedFile ? (
                      <div>
                        <p className="text-white font-medium mb-1">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white font-medium mb-1">
                          Click to select JSON file
                        </p>
                        <p className="text-sm text-gray-500">
                          or drag and drop
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedFile && (
                <button
                  onClick={() => setSelectedFile(null)}
                  disabled={loading}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleImportJson}
                disabled={!selectedFile || loading}
                className="flex-1 bg-secondary hover:bg-secondary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? '🔄 Loading...' : '📥 Import JSON'}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* User Info */}
        {userInfo && (
          <div className="mt-8 space-y-4">
            <h3 className="text-2xl font-bold text-white">
              👤 User Information
            </h3>
            <div className="bg-gray-700 rounded-lg p-4 text-gray-300">
              <p className="text-lg">
                <span className="font-semibold">Username:</span> {userInfo.username}
              </p>
              {userInfo.gamescount && (
                <p className="text-lg">
                  <span className="font-semibold">Total Games:</span> {userInfo.gamescount}
                </p>
              )}
              {userInfo.bio && (
                <p className="text-sm text-gray-400 mt-2">
                  <span className="font-semibold">Bio:</span> {userInfo.bio}
                </p>
              )}
              
              {/* Loading Messages */}
              {loading && loadingMessage && (
                <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg">
                  <p className="text-blue-300 text-sm font-medium">
                    {isRateLimited ? generateRateLimitedMessage() : loadingMessage}
                  </p>
                </div>
              )}
              
              {/* Game Analysis Messages */}
              {loading && lastProcessedGame && !isRateLimited && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
                  <p className="text-green-300 text-sm font-medium">
                    {generateGameMessage(lastProcessedGame)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                📊 Results
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm font-medium"
                >
                  📋 Copy JSON
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition text-sm font-medium"
                >
                  Download JSON
                </button>
              </div>
            </div>

            {result.content && (
              <div className="bg-gray-700 rounded-lg p-4 text-gray-300">
                <p className="text-lg">
                  <span className="font-semibold">Total Games:</span>{' '}
                  {result.content.games.length}
                </p>
                {result.content.pagination && (
                  <p className="text-sm text-gray-400">
                    Pages: {result.content.pagination.currentPage} of{' '}
                    {result.content.pagination.totalPages}
                  </p>
                )}
              </div>
            )}

            <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
              <pre className="text-xs text-gray-300 font-mono">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

