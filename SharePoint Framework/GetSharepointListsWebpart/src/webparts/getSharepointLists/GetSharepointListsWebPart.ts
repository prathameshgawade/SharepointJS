import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { escape } from "@microsoft/sp-lodash-subset";

import { Environment, EnvironmentType } from "@microsoft/sp-core-library";

import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";

import styles from "./GetSharepointListsWebPart.module.scss";
import * as strings from "GetSharepointListsWebPartStrings";

export interface IGetSharepointListsWebPartProps {
  description: string;
}

interface ISharePointList {
  Id: string;
  Title: string;
}

interface ISharePointLists {
  value: ISharePointList[];
}

export default class GetSharepointListsWebPart extends BaseClientSideWebPart<IGetSharepointListsWebPartProps> {
  private _getLists(): Promise<ISharePointLists> {
    return this.context.spHttpClient
      .get(
        `${this.context.pageContext.web.absoluteUrl}/_api/web/lists?$filter=Hidden eq false`,
        SPHttpClient.configurations.v1
      )
      .then((response: SPHttpClientResponse) => {
        return response.json();
      });
  }

  private _renderLists(lists: ISharePointList[]): void {
    let html = "";

    lists.forEach((list: ISharePointList) => {
      html += `<li>
        <p><strong>Title: </strong>${list.Title}</p>
        <p><strong>ID: </strong>${list.Id}</p>
      </li>`;
    });

    let listHtmlElem: Element =
      this.domElement.querySelector("#sharepointLists");
    listHtmlElem.innerHTML = html;
  }

  private _getAndRenderLists(): void {
    if (Environment.type === EnvironmentType.Local) {
    } else if (
      Environment.type === EnvironmentType.SharePoint ||
      Environment.type === EnvironmentType.ClassicSharePoint
    ) {
      this._getLists().then((response: ISharePointLists) => {
        const lists: ISharePointList[] = response.value;
        this._renderLists(lists);
      });
    }
  }

  public render(): void {
    this.domElement.innerHTML = `
      <div class="${styles.getSharepointLists}">
        <div class="${styles.container}">
          <div class="${styles.row}">
            <div class="${styles.column}">
              <span class="${styles.title}">Welcome to SharePoint!</span>
              <p class="${
                styles.subTitle
              }">Customize SharePoint experiences using Web Parts.</p>
              <p class="${styles.description}">${escape(
      this.properties.description
    )}</p>
              <a href="https://aka.ms/spfx" class="${styles.button}">
                <span class="${styles.label}">Learn more</span>
              </a>
            </div>
          </div>

          <div class="${styles.row}">
            <div class="${styles.column}">
              <span class="${styles.title}">Lists on site:</span>
              <ol id="sharepointLists">
              </ol>
            </div>
          </div>
        </div>
      </div>`;

    this._getAndRenderLists();
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("description", {
                  label: strings.DescriptionFieldLabel,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
