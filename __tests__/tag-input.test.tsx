import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagInput } from "@/components/admin/tag-input";

describe("TagInput", () => {
  it("기존 태그를 클릭해 같은 위치에서 수정할 수 있다", () => {
    const handleChange = vi.fn();

    render(
      <TagInput
        label="태그"
        values={["homeserver", "docker-compose", "self-hosting"]}
        suggestions={[]}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "homeserver 태그 수정" }));

    const editInput = screen.getByDisplayValue("homeserver");
    fireEvent.change(editInput, { target: { value: "home-server" } });
    fireEvent.keyDown(editInput, { key: "Enter" });

    expect(handleChange).toHaveBeenCalledWith([
      "home-server",
      "docker-compose",
      "self-hosting",
    ]);
  });

  it("수정 중 Escape를 누르면 원래 태그로 되돌아간다", () => {
    const handleChange = vi.fn();

    render(
      <TagInput
        label="태그"
        values={["homeserver", "docker-compose"]}
        suggestions={[]}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "homeserver 태그 수정" }));
    const editInput = screen.getByDisplayValue("homeserver");
    fireEvent.change(editInput, { target: { value: "home-server" } });
    fireEvent.keyDown(editInput, { key: "Escape" });

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByText("homeserver")).toBeTruthy();
  });
});
