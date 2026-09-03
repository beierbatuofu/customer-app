import { BaseEvent } from "../BaseEvent";
import { UPSERT_CONFIG } from "../event.names";
import { MEMORY_DATA } from "../../config";

const emitter = async function (values: ISettings) {
  MEMORY_DATA.config = values;
};

class UpsertConfig extends BaseEvent {
  constructor() {
    super(UPSERT_CONFIG, emitter);
  }
}

export const upsertConfigIns = new UpsertConfig();
