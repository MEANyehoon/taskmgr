import {Inject, Injectable} from '@angular/core';
import {HttpHeaders, HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import * as _ from 'lodash';
import {Project, User} from '../domain';

@Injectable()
export class ProjectService {
  private readonly domain = 'projects';
  private headers = new HttpHeaders()
    .set('Content-Type', 'application/json');

  constructor(@Inject('BASE_CONFIG') private config,
              private http: HttpClient) {
    // this.headers.append('X-LC-Id', config.LCId);
    // this.headers.append('X-LC-Key', config.LCKey);
  }

  // POST /projects
  add(project: Project): Observable<Project> {
    const uri = `${this.config.uri}/${this.domain}`;
    return this.http
      .post<Project>(uri, JSON.stringify(project), {headers: this.headers});
  }

  // PUT /projects
  update(project: Project): Observable<Project> {
    const uri = `${this.config.uri}/${this.domain}/${project.id}`;
    const toUpdate = {
      name: project.name,
      coverImg: project.coverImg,
      desc: project.desc
    };
    return this.http
      .patch<Project>(uri, JSON.stringify(toUpdate), {headers: this.headers});
  }

  // DELETE /projects instead of deleting the records
  del(project: Project): Observable<Project> {
    const deltask$ = Observable.from(project.taskLists ? project.taskLists : [])
      .mergeMap(listId => this.http
        .delete(`${this.config.uri}/taskLists/${listId}`))
        .count();
    const uri = `${this.config.uri}/${this.domain}/${project.id}`;
    return deltask$.switchMap(p => this.http
      .delete(uri)
      .map(_ => project));
  }

  // GET /projects
  get(userId: string): Observable<Project[]> {
    const uri = `${this.config.uri}/${this.domain}`;
    const params = new HttpParams()
      .set('members_like', userId);
    return this.http
      .get<Project[]>(uri, {params: params, headers: this.headers});
  }

  updateTaskLists(project: Project): Observable<Project> {
    const uri = `${this.config.uri}/${this.domain}/${project.id}`;
    const toUpdate = {
      taskLists: project.taskLists
    };
    return this.http
      .patch<Project>(uri, JSON.stringify(toUpdate), {headers: this.headers});
  }

  inviteMembers(projectId: string, users: User[]) {
    const uri = `${this.config.uri}/${this.domain}/${projectId}`;

    return this.http
      .get(uri)
      .switchMap((project: Project) => {
        const existingMemberIds = project.members;
        const invitedIds = users.map(user => user.id);
        const newIds = _.union(existingMemberIds, invitedIds);
        return this.http.patch(uri, JSON.stringify({ members: newIds }), {headers: this.headers});
      });
  }
}
