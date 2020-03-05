/* 
   Copyright 2020 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   https://www.apache.org/licenses/LICENSE-2.0
 
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

export class Config {
    
    constructor(
        public key : number = 0,
        public type : string ='',
        public field : string = '',
        public x : number = 0,
        public y : number = 0,
        public start_time : number = 0.0,
        public end_time : number = 0.0,
        public font : string = '',
        public color: string = '#000',
        public size : number = 0,
        public width : number = 0,
        public height : number = 0,
        public align : string = 'center',
        public angle : number = 0
        ) {}
        
    public static from_configs_array(config : any) : Config {
        return JSON.parse(config) as Config
    }
            
    public static to_configs_array(configs : Config) : string {
        return JSON.stringify(configs)
    }
}