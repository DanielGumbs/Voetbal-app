import {adminGuard} from '../services/admin.service';
import {Routes} from '@angular/router';

export const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: 'games'},
  {path: 'games', loadComponent: () => import('./game-list/game-list').then(m => m.GameList)},
  {path: 'games/new', canActivate: [adminGuard], loadComponent: () => import('./create-game/create-game').then(m => m.CreateGame)},
  {path: 'games/:id', loadComponent: () => import('./game-detail/game-detail').then(m => m.GameDetailComponent)},
  {path: 'seasons', canActivate: [adminGuard], loadComponent: () => import('./season-manager/season-manager').then(m => m.SeasonManager)},
  {path: 'leaderboard', loadComponent: () => import('./leaderboard/leaderboard').then(m => m.LeaderboardComponent)},
];


