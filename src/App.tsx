import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import './App.css'
import Navbar from './components/Navbar/Navbar'
import HomePage from './pages/Homepage/HomePage';
import Search from './pages/Search/Search';
import Watching from './pages/Watching/Watching';
import List from './pages/List/List';
import SingleShowPage from './pages/SingleShow/SingleShowPage';
import { ListProvider } from './context/List/ListProvaider';
import { SearchProvider } from './context/Search/SearchProvaider';
import { WatchingProvider } from './context/Watching/WatchingProvaider';
import SingleSeasonDetailedPage from './pages/SingleSeasonDetailedPage/SingleSeasonDetailedPage';
import SingleEpisodeDetailedPage from './pages/SingleEpisodeDetailedPage/SingleEpisodeDetailedPage';
import ActorDetailedPage from './pages/ActorDetailedPage/ActorDetailedPage';
import ShowImagesPage from './pages/ShowImagesPage/ShowImagesPage';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';

const Layout = () => (
  <>
    <ScrollToTop />
    <Navbar />
    <Outlet />
  </>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { element: <HomePage /> },
      { path: 'search', element: <Search /> },
      { path: 'show/:showId', element: <SingleShowPage /> },
      { index: true, path: 'watching', element: <Watching /> },
      { path: 'list', element: <List /> },
      { path: 'show/:showId/season/:seasonId', element: <SingleSeasonDetailedPage /> },
      { path: '/show/:showId/episode/:episodeId', element: <SingleEpisodeDetailedPage /> },
      { path: '/actor/:actorId', element: <ActorDetailedPage /> },
      { path: '/show/:showId/images', element: <ShowImagesPage /> },
    ]
  }
]);

export function RouterApp() {
  return (
    <ListProvider>
      <SearchProvider>
        <WatchingProvider>
          <RouterProvider router={router} />
        </WatchingProvider>
      </SearchProvider>
    </ListProvider>
  );
}

export default RouterApp;