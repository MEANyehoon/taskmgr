import { Injectable, Inject } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { concat } from 'rxjs/observable/concat';
import * as models from '../domain';

@Injectable()
export class TaskService {
  private domain: string = 'tasks';
  private headers = new Headers({
    'Content-Type': 'application/json'
  })
  constructor(
    @Inject('BASE_CONFIG') private config,
    private http: Http) { }

  add(task: models.Task): Observable<models.Task> {
    const uri = `${this.config.uri}/${this.domain}`;
    return this.http
      .post(uri, JSON.stringify(task), {headers: this.headers})
      .map(res => res.json());
  }

  update(task: models.Task): Observable<models.Task>{
    const uri = `${this.config.uri}/${this.domain}/${task.id}`;
    return this.http
      .put(uri, JSON.stringify(task), {headers: this.headers})
      .map(res => res.json());
  }

  delete(task: models.Task): Observable<models.Task>{
    const uri = `${this.config.uri}/${this.domain}/${task.id}`;
    return this.http
      .delete(uri)
      .mapTo(task);
  }

    // GET /tasklist
  get(taskListId: string): Observable<models.Task[]>{
    const uri = `${this.config.uri}/${this.domain}`;
    return this.http
      .get(uri, {params: {'taskListId': taskListId}, headers: this.headers})
      .map(res => res.json());
  }
}