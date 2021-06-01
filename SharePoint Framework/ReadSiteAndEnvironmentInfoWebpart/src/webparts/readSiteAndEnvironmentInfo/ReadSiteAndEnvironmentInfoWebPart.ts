import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';
import { 
  Environment,
  EnvironmentType
 } from "@microsoft/sp-core-library";

import styles from './ReadSiteAndEnvironmentInfoWebPart.module.scss';
import * as strings from 'ReadSiteAndEnvironmentInfoWebPartStrings';

export interface IReadSiteAndEnvironmentInfoWebPartProps {
  description: string;
  environmentTitle: string
}

export default class ReadSiteAndEnvironmentInfoWebPart extends BaseClientSideWebPart<IReadSiteAndEnvironmentInfoWebPartProps> {
  private _findOutEnvironment() {
    if(Environment.type === EnvironmentType.Local) {
      this.properties.environmentTitle = "Local Workbench";
    }
    else if(Environment.type === EnvironmentType.SharePoint) {
      this.properties.environmentTitle = "Modern SharePoint";
    }
    else if(Environment.type === EnvironmentType.ClassicSharePoint) {
      this.properties.environmentTitle = "Classic SharePoint";
    }
  }

  public render(): void {
    this.domElement.innerHTML = `
      <div class="${ styles.readSiteAndEnvironmentInfo }">
        <div class="${ styles.container }">
          <div class="${ styles.row }">
            <div class="${ styles.column }">
              <span class="${ styles.title }">Welcome to SharePoint!</span>
              <p class="${ styles.subTitle }">Customize SharePoint experiences using Web Parts.</p>
              <p class="${ styles.description }">${escape(this.properties.description)}</p>

              <p class="${ styles.title }">Site Properties:</p>
              <p class="${ styles.description }">Absolute site URL: ${escape(this.context.pageContext.web.absoluteUrl)}</p>
              <p class="${ styles.description }">Relative site URL: ${escape(this.context.pageContext.web.serverRelativeUrl)}</p>
              <p class="${ styles.description }">Site title: ${escape(this.context.pageContext.web.title)}</p>
              <p class="${ styles.description }">User: ${escape(this.context.pageContext.user.displayName)}</p>
              <hr/>

              <span class="${ styles.title }">Environment Information</span>
              <p class="${ styles.description }">Type of environment: ${this.properties.environmentTitle}</p>

              <a href="https://aka.ms/spfx" class="${ styles.button }">
                <span class="${ styles.label }">Learn more</span>
              </a>
            </div>
          </div>
        </div>
      </div>`;

      this._findOutEnvironment();
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
