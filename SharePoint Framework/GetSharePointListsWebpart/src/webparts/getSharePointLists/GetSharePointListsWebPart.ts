import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { Environment, EnvironmentType } from "@microsoft/sp-core-library";

import styles from './GetSharePointListsWebPart.module.scss';
import * as strings from 'GetSharePointListsWebPartStrings';

export interface IGetSharePointListsWebPartProps {
  description: string;
}

export interface ISharepointList {
  Id: number;
  Title: string
}

export interface ISharepointLists {
  value: ISharepointList[]
}

export default class GetSharePointListsWebPart extends BaseClientSideWebPart<IGetSharePointListsWebPartProps> {

  public render(): void {
    this.domElement.innerHTML = `
      <div class="${ styles.getSharePointLists }">
        <div class="${ styles.container }">
          <div class="${ styles.row }">
            <div class="${ styles.column }">
              <span class="${ styles.title }">Site Lists</span>
              <ul id="sharepoint-lists" class="${ styles.list }">
              </ul>
              </a>
            </div>
          </div>
        </div>
      </div>`;

    this._getAndRenderLists();
  }


  private _getLists(): Promise<ISharepointLists> {
    return this.context.spHttpClient.get(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists?$filter=Hidden eq false`, SPHttpClient.configurations.v1)
      .then((response: SPHttpClientResponse) => {
        return response.json();
      });
  }

  private _renderLists(lists: ISharepointList[]) {
    let html = "";

    lists.forEach((item: ISharepointList, i: number) => {
      html += `<li>
        <p>ID: ${item.Id}</p>
        <p>Title: ${item.Title}</p>
      </li>`
    });

    const listPlaceholder: Element = this.domElement.querySelector("#sharepoint-lists");
    listPlaceholder.innerHTML = html;
  }

  private _getAndRenderLists() {
    if(Environment.type === EnvironmentType.Local) {

    }
    else {
      this._getLists()
      .then((response: ISharepointLists) => {
        this._renderLists(response.value);
      });
    }
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
