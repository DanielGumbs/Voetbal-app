import {Routes} from '@angular/router';

export const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: 'games'},
  {path: 'games', loadComponent: () => import('./game-list/game-list').then(m => m.GameList)},
  {path: 'games/new', loadComponent: () => import('./create-game/create-game').then(m => m.CreateGame)},
  {path: 'leaderboard', loadComponent: () => import('./leaderboard/leaderboard').then(m => m.LeaderboardComponent)},
];
