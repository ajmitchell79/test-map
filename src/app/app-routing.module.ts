import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StatesComponent } from './states/states.component';
import { StormTracksComponent } from './storm-tracks/storm-tracks.component';

const routes: Routes = [
  {
    path: '',redirectTo: 'states', pathMatch: 'full' 
  },
{
  path: 'states',component: StatesComponent, // canActivate: [AuthGuard],
  data: { 
    page: 'states',
    redirectPath: 'states'
  }
},
{
  path: 'tracks',component: StormTracksComponent, //canActivate: [AuthGuard],
  data: { 
    page: 'tracks',
    redirectPath: 'tracks'
  }
}];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const routingComponents = [StatesComponent, StormTracksComponent]
