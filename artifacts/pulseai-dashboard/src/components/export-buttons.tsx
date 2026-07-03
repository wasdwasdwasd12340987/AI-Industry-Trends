import React from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "./ui/button";
import { CSVLink } from "react-csv";

interface ExportButtonsProps {
  data: any[];
  filename: string;
}

export function ExportButtons({ data, filename }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2 print-hide">
      {data && data.length > 0 && (
        <CSVLink data={data} filename={`${filename}.csv`}>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Download className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">CSV</span>
          </Button>
        </CSVLink>
      )}
      <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => window.print()}>
        <Printer className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only">Print</span>
      </Button>
    </div>
  );
}
