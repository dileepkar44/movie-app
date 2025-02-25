import React, { useEffect, useState } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import {useDebounce} from 'react-use'
import { getTrendingMovies, updateSearchCount } from "./appwrite";

const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};
const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [movies,setMovies] = useState([]);
  const [isLoading, setIsLoaading] = useState(false)
  const [debounceSearchTerm,setDebounceSearchTerm] = useState('')
  const [trendingMovies,setTrendingMovies] = useState([])

  useDebounce(()=> setDebounceSearchTerm(searchTerm),500,[searchTerm])
  const fetchMovies = async (query = '') => {
    setIsLoaading(true)
    setErrorMsg('')
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
                          

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }
      const data = await response.json();
      if(data.response === false){
        setErrorMsg(data.Error || 'Failed to fetch movies')
        setMovies([])
        return;
      }
      setMovies(data.results || [])

   if(query && data.results.length > 0 ){
    await updateSearchCount(query, data.results[0])
   }

    } catch (error) {
      console.error(`Error fenching movies: ${error}`);
      setErrorMsg(`Error fetching movies. Please try again later.`);
    }finally{
      setIsLoaading(false)
    }
  };

  const loadTrendingMovies = async (query='') =>{
    try {
      const moviess = await getTrendingMovies()
      setTrendingMovies(moviess)
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`)
    }
  }

  useEffect(()=>{
    loadTrendingMovies()
  },[])

  useEffect(() => {
    fetchMovies(debounceSearchTerm);
  }, [debounceSearchTerm]);
  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./heero.png" alt="Hero Banner" />
          <h1 >
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            without the Hassel
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

       {
        trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {
                trendingMovies.map((movie,index)=>(
                  <li key={movie.$id}>
                    <p>{index+1}</p>
                    <img src={movie.poster_url} alt={movie.title} />
                  </li>
                ))
              }
            </ul>
          </section>
        )
       }

        <section className="all-movies">
          <h2>All Movies</h2>
          {
            isLoading ? (
              <Spinner />
            ): errorMsg ? (
              <p className="text-red-500">{errorMsg}</p>
            ) : (
              <ul>
                {
                  movies.map((movie)=>(
                   <MovieCard key={movie.id} movie={movie} />
                  ))
                }
              </ul>
            )
          }
        </section>
      </div>
    </main>
  );
};

export default App;
